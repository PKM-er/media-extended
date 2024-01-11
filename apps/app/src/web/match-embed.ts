import { toTempFrag, updateHash } from "@/lib/hash/format";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHash, toURL } from "@/lib/url";

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
  url: string;
  hash: string;
  noHash: string;
} | null {
  if (!link) return null;
  const url = toURL(link);
  if (!url) return null;
  switch (true) {
    case url.hostname.contains("youtube"): {
      const newURL = new URL(url);
      let tempFrag = parseTempFrag(newURL.hash);
      const timestamp = parseYoutubeTime(newURL.searchParams.get("t")),
        startTime = parseYoutubeTime(newURL.searchParams.get("start")),
        endTime = parseYoutubeTime(newURL.searchParams.get("end"));
      newURL.searchParams.delete("t");
      newURL.searchParams.delete("start");
      newURL.searchParams.delete("end");

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
          newURL.searchParams.set("t", String(tempFrag.start));
        } else if (tempFrag.start > 0) {
          newURL.searchParams.set("start", String(tempFrag.start));
        } else if (tempFrag.end > 0) {
          newURL.searchParams.set("end", String(tempFrag.end));
        }
      }
      updateHash(newURL, tempFrag);

      return {
        type: "youtube",
        url: newURL.href,
        hash: newURL.hash,
        noHash: noHash(newURL),
      };
    }
    case url.hostname.contains("vimeo"): {
      const newURL = new URL(url);
      const tempFrag = parseTempFrag(newURL.hash);
      updateHash(newURL, tempFrag);
      return {
        type: "vimeo",
        url: newURL.href,
        hash: newURL.hash,
        noHash: noHash(newURL),
      };
    }
    default:
      return null;
  }
}
