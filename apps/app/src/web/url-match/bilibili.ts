import { addTempFrag } from "@/lib/hash/format";
import { parseTempFrag, isTimestamp } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import type { URLResolver } from "./base";
import { SupportedMediaHost } from "./supported";

function parseVideoId(url: URL): string | false | null {
  if (url.hostname === "b23.tv") {
    // short url don't have vid in url
    return false;
  }
  if (!url.hostname.endsWith(".bilibili.com")) {
    return null;
  }
  if (url.pathname.startsWith("/video/")) {
    return url.pathname.split("/").filter(Boolean).slice(-1).at(-1)!;
  }
  return false;
}

export const bilibiliResolver: URLResolver = (url) => {
  const vid = parseVideoId(url);
  if (vid === null) return null;
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

  // add temp frag parsed from url to the source url
  addTempFrag(source, tempFrag);

  return {
    source,
    cleaned,
    type: SupportedMediaHost.Bilibili,
    id: vid || undefined,
  };
};

function parseTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
