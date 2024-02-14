import { parseLinktext } from "obsidian";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/view-type";
import type { LinkEvent } from "@/patch/event";
import { checkMediaType } from "@/patch/media-type";
import { MediaHost } from "@/web/url-match/supported";

export const onExternalLinkClick: LinkEvent["onExternalLinkClick"] =
  async function (this, link, newLeaf, fallback) {
    const url = this.resolveUrl(link);
    if (!url || (url.type === MediaHost.Generic && !url.isFileUrl)) {
      fallback();
      return;
    }
    await this.leafOpener.openMedia(url, newLeaf);
  };

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
