/* eslint-disable @typescript-eslint/naming-convention */
import { Notice, Platform, parseLinktext } from "obsidian";
import { isFileMediaInfo } from "@/media-view/media-info";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "@/patch/event";
import { checkMediaType } from "@/patch/media-type";
import type { MediaURL } from "@/web/url-match";
import { MediaHost } from "@/web/url-match/supported";
import { fileOperations } from "../media-view/menu/file-op";
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
    if (isFileMediaInfo(url)) {
      new Notice("For in-vault media, use internal link instead");
      fallback();
      return;
    }
    if (!url || !shouldOpenMedia(url, this)) {
      fallback();
      return;
    }
    await this.leafOpener.openMedia(url, newLeaf, { fromUser: true });
  };

export async function showItemInFolder(fullpath: string) {
  if (!Platform.isDesktopApp) return;
  const electron = (window as any).electron;
  if (!electron) return;
  const shell = (
    Platform.isMacOS ? electron.remote.shell : electron.shell
  ) as typeof Electron.shell;
  await shell.showItemInFolder(fullpath);
}
export async function openPath(fullpath: string) {
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
      if (isFileMediaInfo(url)) {
        new Notice("For in-vault media, use internal link instead");
        return;
      }
      fileOperations(url, menu);
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
