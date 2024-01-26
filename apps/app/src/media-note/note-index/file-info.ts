import type { Vault } from "obsidian";
import { TFile } from "obsidian";
import type { MediaFileViewType } from "@/media-view/view-type";
import {
  isMediaFileViewType,
  MEDIA_FILE_VIEW_TYPE,
} from "@/media-view/view-type";
import { checkMediaType, type MediaType } from "@/patch/media-type";

export interface FileMediaInfo {
  viewType: MediaFileViewType;
  type: MediaType;
  file: TFile;
  hash: string;
}

export function isFileMediaInfo(info: unknown): info is FileMediaInfo {
  return isMediaFileViewType((info as FileMediaInfo).viewType);
}

export function parseFileInfo(
  filePath: string,
  hash: string,
  vault: Vault,
): FileMediaInfo | null {
  const file = vault.getAbstractFileByPath(filePath);
  if (!file || !(file instanceof TFile)) return null;
  const type = checkMediaType(file.extension);
  if (!type) return null;
  return {
    type,
    file,
    hash,
    viewType: MEDIA_FILE_VIEW_TYPE[type],
  };
}
