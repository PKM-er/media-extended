import type { TempFragment } from "@/lib/hash/temporal-frag";
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
  if (
    url.hostname !== "bilibili.com" &&
    !url.hostname.endsWith(".bilibili.com")
  ) {
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
  if (cleaned.hostname === "bilibili.com") {
    cleaned.hostname = "www.bilibili.com";
  }
  cleaned.searchParams.forEach((val, key, params) => {
    if (key === "p" && val !== "1") return;
    params.delete(key);
  });
  cleaned.searchParams.sort();
  const pid = cleaned.searchParams.get("p") ?? "1";

  let source = new URL(cleaned);
  if (!tempFrag && time > 0) {
    tempFrag = { start: time, end: -1 };
  }

  if (tempFrag && isTimestamp(tempFrag)) {
    source = addBilibiliTime(source, tempFrag);
  }
  source = removeHashTempFragment(source);

  return {
    source,
    cleaned,
    tempFrag,
    print: (frag) => addBilibiliTime(source, frag).href,
    id: `${pid}@${vid}` || undefined,
  };
};

function addBilibiliTime(url: URL, frag: TempFragment) {
  const newUrl = new URL(url.href);
  newUrl.searchParams.set("t", String(frag.start));
  return newUrl;
}

function parseTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
