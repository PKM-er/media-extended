import type { TFile } from "obsidian";
import { parseLinktext } from "obsidian";
import {
  MEDIA_FILE_VIEW_TYPE,
  isMediaFileViewType,
  type MediaFileViewType,
} from "@/media-view/file-view";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/utils";
import { openInOpenedPlayer } from "./opened";

export interface FileMediaInfo {
  viewType: MediaFileViewType;
  file: TFile;
  hash: string;
}

export function isFileMediaInfo(info: unknown): info is FileMediaInfo {
  return isMediaFileViewType((info as FileMediaInfo).viewType);
}

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
  if (
    !newLeaf &&
    openInOpenedPlayer(
      {
        file: linkFile,
        hash: subpath,
        viewType: MEDIA_FILE_VIEW_TYPE[mediaType],
      },
      workspace,
    )
  ) {
    return;
  }
  fallback();
}
