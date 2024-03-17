import type { MediaState } from "@vidstack/react";
import type { Vault } from "obsidian";
import type { MediaInfo } from "@/media-view/media-info";
import { mediaInfoToURL, type MediaURL } from "@/web/url-match";
import { MediaHost } from "@/web/url-match/supported";

export function urlTitle(url: MediaURL, playerState?: MediaState) {
  if (playerState?.title) return playerState.title;
  if (url.isFileUrl) {
    const filenameSeg = url.pathname.split("/").pop()?.split(".");
    filenameSeg?.pop();
    const basename = filenameSeg?.join(".");
    if (basename) return basename;
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
  { state, vault }: { state?: MediaState; vault: Vault },
) {
  const url = mediaInfoToURL(mediaInfo, vault);
  return urlTitle(url, state);
}
