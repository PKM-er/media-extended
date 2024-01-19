import type { TFile } from "obsidian";
import type { MediaFileViewType } from "@/media-view/view-type";
import { isMediaFileViewType } from "@/media-view/view-type";
import type { MediaType } from "@/patch/utils";

export interface FileMediaInfo {
  viewType: MediaFileViewType;
  type: MediaType;
  file: TFile;
  hash: string;
}

export function isFileMediaInfo(info: unknown): info is FileMediaInfo {
  return isMediaFileViewType((info as FileMediaInfo).viewType);
}
