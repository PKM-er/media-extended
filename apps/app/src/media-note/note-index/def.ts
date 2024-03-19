import type { TFile } from "obsidian";
import { isFileMediaInfo, type MediaInfo } from "@/info/media-info";

export const mediaSourceFieldMap = {
  generic: "media",
  video: "video",
  audio: "audio",
} as const;
export type MediaSourceFieldType =
  (typeof mediaSourceFieldMap)[keyof typeof mediaSourceFieldMap];
export const mediaSourceFields = Object.values(
  mediaSourceFieldMap,
) as MediaSourceFieldType[];

export function toInfoKey(mediaInfo: MediaInfo) {
  if (isFileMediaInfo(mediaInfo)) {
    return `file:${mediaInfo.file.path}`;
  }
  return `url:${mediaInfo.jsonState.source}`;
}
export function compare(a: MediaInfo | undefined, b: MediaInfo | undefined) {
  if (!a || !b) return false;
  const aKey = toInfoKey(a);
  const bKey = toInfoKey(b);
  return aKey === bKey;
}

export interface InternalLinkField {
  type: "internal";
  media: "video" | "audio";
  source: TFile;
  subpath: string;
  original: string;
}
export interface ExternalLinkField {
  type: "external";
  media: MediaSourceFieldType;
  source: URL;
  subpath: string;
  original: string;
  isSameSource: (src: string) => boolean;
}
