import { assertNever } from "assert-never";
import type { FileMediaInfo, MediaInfo } from "@/media-view/media-info";
import type {
  MediaFileViewType,
  MediaViewType,
  RemoteMediaViewType,
} from "@/media-view/view-type";
import {
  MEDIA_URL_VIEW_TYPE,
  MEDIA_EMBED_VIEW_TYPE,
  MEDIA_WEBPAGE_VIEW_TYPE,
} from "@/media-view/view-type";
import { SupportedMediaHost } from "./supported";
import { MediaURL } from ".";

export function getSupportedViewType(url: MediaURL): RemoteMediaViewType[];
export function getSupportedViewType(url: FileMediaInfo): MediaFileViewType[];
export function getSupportedViewType(url: MediaInfo): MediaViewType[];
export function getSupportedViewType(url: MediaInfo): MediaViewType[] {
  if (!(url instanceof MediaURL)) {
    return [url.viewType];
  }
  if (url.type === SupportedMediaHost.Generic) {
    switch (url.inferredType) {
      case "video":
        return [MEDIA_URL_VIEW_TYPE.video, MEDIA_WEBPAGE_VIEW_TYPE];
      case "audio":
        return [MEDIA_URL_VIEW_TYPE.audio, MEDIA_WEBPAGE_VIEW_TYPE];
      default:
        return [
          MEDIA_WEBPAGE_VIEW_TYPE,
          MEDIA_URL_VIEW_TYPE.video,
          MEDIA_URL_VIEW_TYPE.audio,
        ];
    }
  }
  switch (url.type) {
    case SupportedMediaHost.YouTube:
    case SupportedMediaHost.Vimeo:
      return [MEDIA_WEBPAGE_VIEW_TYPE, MEDIA_EMBED_VIEW_TYPE];
    case SupportedMediaHost.Bilibili:
      return [MEDIA_WEBPAGE_VIEW_TYPE];
    default:
      assertNever(url.type);
  }
}
