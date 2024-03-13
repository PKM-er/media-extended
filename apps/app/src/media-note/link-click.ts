/* eslint-disable @typescript-eslint/naming-convention */
import { Notice, Platform, parseLinktext } from "obsidian";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "@/patch/event";
import { checkMediaType } from "@/patch/media-type";
import type { MediaURL } from "@/web/url-match";
import { MediaHost } from "@/web/url-match/supported";
import { openAsMenu } from "../media-view/menu/open-as";

export function shouldOpenMedia(url: MediaURL, plugin: MxPlugin): boolean {
  return !!(
    url.type !== MediaHost.Generic ||
    url.inferredType ||
    url.tempFrag ||
    plugin.mediaNote.findNotes(url).length > 0 ||
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
    await this.leafOpener.openMedia(url, newLeaf, { fromUser: true });
  };

async function showItemInFolder(fullpath: string) {
  if (!Platform.isDesktopApp) return;
  const electron = (window as any).electron;
  if (!electron) return;
  const shell = (
    Platform.isMacOS ? electron.remote.shell : electron.shell
  ) as typeof Electron.shell;
  await shell.showItemInFolder(fullpath);
}
async function openPath(fullpath: string) {
  if (!Platform.isDesktopApp) return;
  const electron = (window as any).electron;
  if (!electron) return;
  const shell = (
    Platform.isMacOS ? electron.remote.shell : electron.shell
  ) as typeof Electron.shell;
  const err = await shell.openPath(fullpath);
  if (err) throw new Error(err);
}

export function handleExternalLinkMenu(plugin: MxPlugin) {
  plugin.registerEvent(
    plugin.app.workspace.on("url-menu", (menu, link) => {
      const url = plugin.resolveUrl(link);
      if (!url) return;

      if (Platform.isDesktopApp && url.isFileUrl && url.filePath) {
        const filePath = url.filePath;
        menu
          .addItem((item) =>
            item
              .setIcon("folder")
              .setTitle(
                Platform.isMacOS
                  ? "Reveal in Finder"
                  : "Show in system explorer",
              )
              .onClick(() => {
                showItemInFolder(filePath).catch((err) => {
                  new Notice(
                    `Failed to open file in file explorer: ${err.message}`,
                  );
                  console.error("Failed to open file in file explorer", err);
                });
              }),
          )
          .addItem((item) =>
            item
              .setIcon("arrow-up-right")
              .setTitle("Open in system player")
              .onClick(() => {
                openPath(filePath).catch((err) => {
                  new Notice(
                    `Failed to open file in system player: ${err.message}`,
                  );
                  console.error("Failed to open file in system player", err);
                });
              }),
          );
      }

      const supported = plugin.urlViewType.getSupported(url);
      const preferred = plugin.urlViewType.getPreferred(url);
      const targetViewTypes = shouldOpenMedia(url, plugin)
        ? supported.filter((t) => t !== preferred)
        : supported;
      openAsMenu(menu, { targetViewTypes, url, mode: "once", plugin });
      openAsMenu(menu, { targetViewTypes, url, mode: "always", plugin });
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
    await this.leafOpener.openMedia(mediaInfo, newLeaf, { fromUser: true });
  };
