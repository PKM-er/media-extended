import type { MediaState } from "@vidstack/react";
import { isFileMediaInfo, type MediaInfo } from "@/info/media-info";
import { type MediaURL } from "@/info/media-url";
import { MediaHost } from "@/info/supported";
import { toFileInfo } from "@/lib/file-info";

export function urlTitle(url: MediaURL, playerState?: MediaState) {
  if (playerState?.title) return playerState.title;
  if (url.isFileUrl) {
    const { basename, extension } = toFileInfo(url.pathname);
    if (extension) return basename;
  }
  if (url.type !== MediaHost.Generic && url.id) {
    return `${url.type}: ${url.id}`;
  }
  return (
    url.source.hostname + decodeURI(url.source.pathname).replaceAll("/", "_")
  );
}

export function mediaTitle(
  mediaInfo: MediaInfo,
  { state }: { state?: MediaState } = {},
) {
  if (isFileMediaInfo(mediaInfo)) {
    return mediaInfo.file.basename;
  }
  return urlTitle(mediaInfo, state);
}
