import type { Vault } from "obsidian";
import { TFile } from "obsidian";
import type { MediaURL } from "@/info/media-url";
import { checkMediaType, type MediaType } from "./media-type";

export type MediaInfo = FileMediaInfo | MediaURL;

export interface FileMediaInfo {
  type: MediaType;
  file: TFile;
  hash: string;
}

export function isFileMediaInfo(info: unknown): info is FileMediaInfo {
  return (info as FileMediaInfo)?.file instanceof TFile;
}

export function mediaInfoFromFile(
  file: TFile | null,
  hash: string,
): FileMediaInfo | null {
  if (!file) return null;
  const type = checkMediaType(file.extension);
  if (!type) return null;
  return { type, file, hash };
}

export function mediaInfoFromFilePath(
  filePath: string,
  hash: string,
  vault: Vault,
): FileMediaInfo | null {
  const file = vault.getFileByPath(filePath);
  if (!file) return null;
  return mediaInfoFromFile(file, hash);
}

export function getMediaInfoID(mediaInfo: MediaInfo) {
  if (isFileMediaInfo(mediaInfo)) {
    return `file:${mediaInfo.file.path}`;
  }
  return `url:${mediaInfo.jsonState.source}`;
}
