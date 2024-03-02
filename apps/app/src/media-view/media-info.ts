import type { Vault } from "obsidian";
import { TFile } from "obsidian";
import { checkMediaType, type MediaType } from "@/patch/media-type";
import type { MediaURL } from "@/web/url-match";

export type MediaInfo = FileMediaInfo | MediaURL;

export interface FileMediaInfo {
  type: MediaType;
  file: TFile;
  hash: string;
}

export function isFileMediaInfo(info: unknown): info is FileMediaInfo {
  return (info as FileMediaInfo).file instanceof TFile;
}

export function parseFileInfo(
  filePath: string,
  hash: string,
  vault: Vault,
): FileMediaInfo | null {
  const file = vault.getFileByPath(filePath);
  if (!file) return null;
  const type = checkMediaType(file.extension);
  if (!type) return null;
  return {
    type,
    file,
    hash,
  };
}
