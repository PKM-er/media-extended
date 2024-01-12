import { toTempFrag, updateHash } from "@/lib/hash/format";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { toURL } from "@/lib/url";

export type SupportedEmbedHost = "vimeo" | "youtube";

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

export function matchHostForEmbed(link: string | undefined): {
  type: SupportedEmbedHost;
  source: URL;
  // url used to compare if two embeds are the same
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const url = toURL(link);
  if (!url) return null;
  switch (true) {
    case url.hostname.contains("youtu.be"):
    case url.hostname.contains("youtube"): {
      let tempFrag = parseTempFrag(url.hash);
      const timestamp = parseYoutubeTime(url.searchParams.get("t")),
        startTime = parseYoutubeTime(url.searchParams.get("start")),
        endTime = parseYoutubeTime(url.searchParams.get("end"));

      const vid = url.hostname.contains("youtu.be")
        ? url.pathname.slice(1)
        : url.searchParams.get("v");

      if (!vid) return null;

      const cleanUrl = new URL("https://www.youtube.com/watch");
      cleanUrl.search = new URLSearchParams({
        v: vid,
      }).toString();

      const source = new URL(cleanUrl);
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
        if (isTimestamp(tempFrag)) {
          source.searchParams.set("t", String(tempFrag.start));
        } else if (tempFrag.start > 0) {
          source.searchParams.set("start", String(tempFrag.start));
        } else if (tempFrag.end > 0) {
          source.searchParams.set("end", String(tempFrag.end));
        }
      }
      updateHash(source, tempFrag);

      return {
        type: "youtube",
        source,
        cleanUrl,
      };
    }
    case url.hostname.contains("vimeo"): {
      const cleanUrl = new URL(url);
      cleanUrl.search = "";

      const source = new URL(url);
      const tempFrag = parseTempFrag(source.hash);
      updateHash(source, tempFrag);

      return {
        type: "vimeo",
        cleanUrl,
        source,
      };
    }
    default:
      return null;
  }
}
