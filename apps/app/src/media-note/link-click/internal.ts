import { parseLinktext } from "obsidian";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/file-view";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/utils";
import { openInOpenedPlayer } from "./opened";

export function onInternalLinkClick(
  this: MxPlugin,
  linktext: string,
  sourcePath: string,
  newLeaf: boolean,
  fallback: () => void,
) {
  const { workspace, metadataCache } = this.app;
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
  if (!newLeaf && openInOpenedPlayer(mediaInfo, workspace)) {
    return;
  }
  fallback();
}
