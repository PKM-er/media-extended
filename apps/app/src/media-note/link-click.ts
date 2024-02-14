/* eslint-disable @typescript-eslint/naming-convention */
import type { MenuItem } from "obsidian";
import { parseLinktext } from "obsidian";
import type { RemoteMediaViewType } from "@/media-view/view-type";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "@/patch/event";
import { checkMediaType } from "@/patch/media-type";
import type { MediaURL } from "@/web/url-match";
import { MediaHost } from "@/web/url-match/supported";

function shouldOpenMedia(url: MediaURL, plugin: MxPlugin): boolean {
  return !!(
    (url.isFileUrl && url.inferredType) ||
    url.tempFrag ||
    url.type !== MediaHost.Generic ||
    plugin.urlViewType.getPreferred(url, true)
  );
}

export const onExternalLinkClick: LinkEvent["onExternalLinkClick"] =
  async function (this, link, newLeaf, fallback) {
    const url = this.resolveUrl(link);
    if (!url || !shouldOpenMedia(url, this)) {
      fallback();
      return;
    }
    await this.leafOpener.openMedia(url, newLeaf);
  };

const mediaTypeDisplay: Record<
  RemoteMediaViewType,
  { label: string; icon: string }
> = {
  "mx-embed": { label: "iframe", icon: "code" },
  "mx-url-audio": { label: "regular audio", icon: "headphones" },
  "mx-url-video": { label: "regular video", icon: "film" },
  "mx-webpage": { label: "webpage", icon: "globe" },
};

export function handleExternalLinkMenu(plugin: MxPlugin) {
  plugin.registerEvent(
    plugin.app.workspace.on("url-menu", (menu, link) => {
      const url = plugin.resolveUrl(link);
      if (!url) return;
      const { protocol, hostname, pathname } = url;
      const supported = plugin.urlViewType.getSupported(url);
      const preferred = plugin.urlViewType.getPreferred(url);
      const showInMenu = shouldOpenMedia(url, plugin)
        ? supported.filter((t) => t !== preferred)
        : supported;
      if (showInMenu.length === 0) return;
      function setLabel(
        item: MenuItem,
        viewType: RemoteMediaViewType,
        noPrefix = false,
      ) {
        const label = mediaTypeDisplay[viewType].label;
        return item
          .setTitle(noPrefix ? label : `Open as ${label}`)
          .setIcon(mediaTypeDisplay[viewType].icon);
      }
      showInMenu.forEach((viewType) => {
        menu.addItem((item) =>
          setLabel(item, viewType)
            .setSection("mx-link")
            .onClick(async () => {
              await plugin.leafOpener.openMedia(url, undefined, { viewType });
            }),
        );
      });
      menu.addItem((item) => {
        const matchUrl = item
          .setTitle("Always open this url as")
          .setIcon("external-link")
          .setSection("mx-link")
          .setSubmenu();
        showInMenu.forEach((viewType) => {
          matchUrl.addItem((item) =>
            setLabel(item, viewType, true)
              .setSection("mx-link")
              .onClick(async () => {
                plugin.urlViewType.setPreferred(
                  { protocol, hostname, pathname },
                  viewType,
                );
                await plugin.leafOpener.openMedia(url, undefined, {
                  viewType,
                });
              }),
          );
        });
      });
      if (hostname)
        menu.addItem((item) => {
          const matchHostname = item
            .setTitle(`Always open ${hostname} as`)
            .setIcon("external-link")
            .setSection("mx-link")
            .setSubmenu();
          showInMenu.forEach((viewType) => {
            matchHostname.addItem((item) =>
              setLabel(item, viewType, true)
                .setSection("mx-link")
                .onClick(async () => {
                  plugin.urlViewType.setPreferred(
                    { protocol, hostname },
                    viewType,
                  );
                  await plugin.leafOpener.openMedia(url, undefined, {
                    viewType,
                  });
                }),
            );
          });
        });
    }),
  );
}

export const onInternalLinkClick: LinkEvent["onInternalLinkClick"] =
  async function (this, linktext, sourcePath, newLeaf, fallback) {
    const { metadataCache } = this.app;
    const { path: linkpath, subpath } = parseLinktext(linktext);
    const linkFile = metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
    let mediaType;
    if (!linkFile || !(mediaType = checkMediaType(linkFile.extension))) {
      fallback();
      return;
    }
    const mediaInfo = {
      file: linkFile,
      hash: subpath,
      type: mediaType,
      viewType: MEDIA_FILE_VIEW_TYPE[mediaType],
    };
    await this.leafOpener.openMedia(mediaInfo, newLeaf);
  };
