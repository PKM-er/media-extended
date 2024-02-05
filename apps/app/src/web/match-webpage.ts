import { updateHash } from "@/lib/hash/format";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl, toURL } from "@/lib/url";
import { matchYouTube } from "./url-match/yt";

/* eslint-disable @typescript-eslint/naming-convention */
export enum SupportedWebHost {
  Bilibili = "bilibili",
  YouTube = "youtube",
  Generic = "generic",
}

export type SupportedWebHostNoGeneric = Exclude<
  SupportedWebHost,
  SupportedWebHost.Generic
>;

export const webHostDisplayNameNoGeneric: Record<
  SupportedWebHostNoGeneric,
  string
> = {
  [SupportedWebHost.Bilibili]: "Bilibili",
  [SupportedWebHost.YouTube]: "YouTube",
};

export const webHostUrl: Record<SupportedWebHostNoGeneric, string> = {
  [SupportedWebHost.Bilibili]: "https://www.bilibili.com",
  [SupportedWebHost.YouTube]: "https://www.youtube.com",
};

export const webHostDisplayName: Record<SupportedWebHost, string> = {
  ...webHostDisplayNameNoGeneric,
  [SupportedWebHost.Generic]: "Web",
};

export function matchHostForWeb(link: string | undefined): {
  type: SupportedWebHost;
  source: URL;
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const _url = toURL(link);
  if (!_url) return null;
  const url = _url;
  switch (true) {
    case url.hostname.endsWith(".bilibili.com"):
    case url.hostname === "b23.tv": {
      let tempFrag = parseTempFrag(url.hash);
      const time = parseTimeFromBilibiliUrl(url);

      const cleanUrl = noHashUrl(url);
      cleanUrl.searchParams.forEach((val, key, params) => {
        if (key === "p" && val !== "1") return;
        params.delete(key);
      });
      cleanUrl.searchParams.sort();

      const source = new URL(cleanUrl);
      if (!tempFrag && time > 0) {
        tempFrag = { start: time, end: -1 };
      }

      if (tempFrag && isTimestamp(tempFrag)) {
        source.searchParams.set("t", String(tempFrag.start));
      }
      updateHash(source, tempFrag);

      return {
        type: SupportedWebHost.Bilibili,
        source,
        cleanUrl,
      };
    }
    case url.hostname.contains("youtu.be"):
    case url.hostname.contains("youtube"): {
      const result = matchYouTube(url);
      if (!result) return null;
      return {
        type: SupportedWebHost.YouTube,
        ...result,
      };
    }
    default:
      return {
        type: SupportedWebHost.Generic,
        source: url,
        cleanUrl: url,
      };
  }
}

function parseTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
