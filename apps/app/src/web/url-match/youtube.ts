import { toTempFrag } from "@/lib/hash/format";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import { removeHashTempFragment, type URLResolver } from "./base";
import { MediaHost } from "./supported";

function parseVideoId(url: URL): string | null {
  const pathSegments = url.pathname.split("/");
  // http://youtu.be/0zM3nApSvMg
  if (url.hostname === "youtu.be") {
    if (pathSegments.length === 2) return pathSegments[1];
  }
  if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
    // https://youtube.com/shorts/0dPkkQeRwTI?feature=share
    if (pathSegments.length === 2 && pathSegments[1] === "watch") {
      return url.searchParams.get("v");
    }
    // http://www.youtube.com/v/0zM3nApSvMg
    // http://www.youtube.com/embed/0zM3nApSvMg?rel=0
    // https://youtube.com/shorts/0dPkkQeRwTI
    const idInPath = ["shorts", "embed", "v"];
    if (pathSegments.length === 3 && idInPath.includes(pathSegments[1])) {
      return pathSegments[2];
    }
  }
  return null;
}

export const youtubeDetecter = (url: URL) =>
  parseVideoId(url) ? MediaHost.YouTube : null;

export const youtubeResolver: URLResolver = (url) => {
  let tempFrag = parseTempFrag(url.hash);
  const timestamp = parseYoutubeTime(url.searchParams.get("t")),
    startTime = parseYoutubeTime(url.searchParams.get("start")),
    endTime = parseYoutubeTime(url.searchParams.get("end"));

  const vid = parseVideoId(url);
  if (!vid) throw new Error("Invalid youtube url");

  const cleaned = noHashUrl("https://www.youtube.com/watch");
  cleaned.search = new URLSearchParams({
    v: vid,
  }).toString();

  const source = new URL(cleaned);
  if (url.searchParams.has("list")) {
    source.searchParams.set("list", url.searchParams.get("list")!);
  }
  if (!tempFrag) {
    if (startTime > 0 && endTime > 0) {
      tempFrag = toTempFrag(startTime, endTime);
    } else if (startTime > 0) {
      tempFrag = { start: startTime, end: Infinity };
    } else if (endTime > 0) {
      tempFrag = { start: 0, end: endTime };
    } else if (timestamp > 0) {
      tempFrag = { start: timestamp, end: -1 };
    }
  }
  // use native timestamp and range
  if (tempFrag) {
    const ytStart = toYoutubeTime(tempFrag.start),
      ytEnd = toYoutubeTime(tempFrag.end);
    if (isTimestamp(tempFrag)) {
      source.searchParams.set("t", ytStart);
    } else {
      if (tempFrag.start > 0 && tempFrag.end > 0 && ytStart === ytEnd) {
        source.searchParams.set("t", ytStart);
      } else {
        if (tempFrag.start > 0) {
          source.searchParams.set("start", ytStart);
        }
        if (tempFrag.end > 0) {
          source.searchParams.set("end", ytEnd);
        }
      }
    }
  }

  return {
    source: removeHashTempFragment(source),
    cleaned,
    id: vid,
  };
};

function toYoutubeTime(time: number) {
  return time.toFixed(0);
}

function parseYoutubeTime(t: string | null): number {
  if (!t) return NaN;
  // handle t=300
  const timeDigitOnly = Number(t);
  if (!Number.isNaN(timeDigitOnly)) {
    return timeDigitOnly;
  }
  // handle t=1h30m20s or t=1h30m or t=30m20s or t=30m or t=11h
  const patternWithNamedGroup =
    /^(?:(?<h>\d+)h)?(?:(?<m>\d+)m)?(?:(?<s>\d+)s)?$/;
  const match = t.match(patternWithNamedGroup);
  if (!match) return NaN;
  const { h, m, s } = match.groups!;
  const hours = h ? Number(h) : 0;
  const minutes = m ? Number(m) : 0;
  const seconds = s ? Number(s) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}
