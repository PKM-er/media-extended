import type { TFile } from "obsidian";
import { type MediaInfo } from "@/info/media-info";
import { getMediaInfoID } from "@/info/media-info";

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

export function compare(
  a: MediaInfo | undefined | null,
  b: MediaInfo | undefined | null,
) {
  if (!a || !b) return false;
  const aKey = getMediaInfoID(a);
  const bKey = getMediaInfoID(b);
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
