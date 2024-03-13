// eslint-disable-next-line @typescript-eslint/naming-convention

import type { MediaType } from "@/patch/media-type";
import type { AudioFileView, VideoFileView } from "./file-view";
import type { MediaEmbedView } from "./iframe-view";
import type { VideoUrlView, AudioUrlView } from "./url-view";
import type { MediaWebpageView } from "./webpage-view";

export const MEDIA_URL_VIEW_TYPE = {
  video: "mx-url-video",
  audio: "mx-url-audio",
} as const satisfies Record<MediaType, string>;
export type MediaUrlViewType =
  (typeof MEDIA_URL_VIEW_TYPE)[keyof typeof MEDIA_URL_VIEW_TYPE];
const urlViewTypes = new Set(Object.values(MEDIA_URL_VIEW_TYPE));

export function isMediaUrlViewType(type: string): type is MediaUrlViewType {
  return urlViewTypes.has(type as any);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_EMBED_VIEW_TYPE = "mx-embed" as const;
export type MediaEmbedViewType = typeof MEDIA_EMBED_VIEW_TYPE;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_WEBPAGE_VIEW_TYPE = "mx-webpage" as const;
export type MediaWebpageViewType = typeof MEDIA_WEBPAGE_VIEW_TYPE;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_FILE_VIEW_TYPE = {
  video: "mx-file-video",
  audio: "mx-file-audio",
} as const satisfies Record<MediaType, string>;

const fileViewTypes = new Set(Object.values(MEDIA_FILE_VIEW_TYPE));

export type MediaFileViewType =
  (typeof MEDIA_FILE_VIEW_TYPE)[keyof typeof MEDIA_FILE_VIEW_TYPE];

export function isMediaFileViewType(type: string): type is MediaFileViewType {
  return fileViewTypes.has(type as any);
}

export function isRemoteMediaViewType(
  type: string,
): type is RemoteMediaViewType {
  return (
    isMediaUrlViewType(type) ||
    MEDIA_EMBED_VIEW_TYPE === type ||
    MEDIA_WEBPAGE_VIEW_TYPE === type
  );
}

export type MediaView = VideoFileView | AudioFileView | RemoteMediaView;

export type RemoteMediaViewType =
  | MediaUrlViewType
  | MediaEmbedViewType
  | MediaWebpageViewType;

export type RemoteMediaView =
  | VideoUrlView
  | AudioUrlView
  | MediaWebpageView
  | MediaEmbedView;

export type MediaViewType =
  | MediaFileViewType
  | MediaUrlViewType
  | MediaEmbedViewType
  | MediaWebpageViewType;

export function isMediaViewType(type: string): type is MediaViewType {
  return isMediaFileViewType(type) || isRemoteMediaViewType(type);
}

export const screenshotAllowed = new Set([
  MEDIA_URL_VIEW_TYPE.video,
  MEDIA_FILE_VIEW_TYPE.video,
  MEDIA_WEBPAGE_VIEW_TYPE,
]);
