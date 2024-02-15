import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import {
  removeHashTempFragment,
  type URLDetecter,
  type URLResolver,
} from "./base";
import { MediaHost } from "./supported";

function parseVideoId(url: URL): string | false | null {
  if (url.hostname === "b23.tv") {
    // short url don't have vid in url
    return false;
  }
  if (!url.hostname.endsWith(".bilibili.com")) {
    return null;
  }
  if (
    url.pathname.startsWith("/video/") ||
    url.pathname.startsWith("/bangumi/play/")
  ) {
    // Extract the last segment of the pathname as the video ID
    return url.pathname.split("/").filter(Boolean).slice(-1)[0];
  }
  return null;
}

export const bilibiliDetecter: URLDetecter = (url) => {
  const vid = parseVideoId(url);
  if (vid === null) return null;
  return MediaHost.Bilibili;
};

export const bilibiliResolver: URLResolver = (url) => {
  const vid = parseVideoId(url);
  if (vid === null) {
    throw new Error("Invalid bilibili url");
  }
  let tempFrag = parseTempFrag(url.hash);
  const time = parseTimeFromBilibiliUrl(url);

  const cleaned = noHashUrl(url);
  cleaned.searchParams.forEach((val, key, params) => {
    if (key === "p" && val !== "1") return;
    params.delete(key);
  });
  cleaned.searchParams.sort();

  const source = new URL(cleaned);
  if (!tempFrag && time > 0) {
    tempFrag = { start: time, end: -1 };
  }

  if (tempFrag && isTimestamp(tempFrag)) {
    source.searchParams.set("t", String(tempFrag.start));
  }

  return {
    source: removeHashTempFragment(source),
    cleaned,
    id: vid || undefined,
  };
};

function parseTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
