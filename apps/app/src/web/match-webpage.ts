import { updateHash } from "@/lib/hash/format";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHash, toURL } from "@/lib/url";

/* eslint-disable @typescript-eslint/naming-convention */
export enum SupportedWebHost {
  Bilibili = "bilibili",
  Generic = "generic",
}

export const webHostDisplayName: Record<SupportedWebHost, string> = {
  [SupportedWebHost.Bilibili]: "Bilibili",
  [SupportedWebHost.Generic]: "Web",
};

export function matchHostForWeb(link: string | undefined): {
  type: SupportedWebHost;
  url: string;
  hash: string;
  noHash: string;
} | null {
  if (!link) return null;
  const url = toURL(link);
  if (!url) {
    const [noHash, ..._hash] = link.split("#");
    const hash = "#" + _hash.join("#");
    return {
      type: SupportedWebHost.Generic,
      url: link,
      hash,
      noHash,
    };
  }
  switch (true) {
    case url.hostname.endsWith(".bilibili.com"):
    case url.hostname === "b23.tv": {
      const newURL = new URL(url);
      let tempFrag = parseTempFrag(newURL.hash);
      const time = parseTimeFromBilibiliUrl(newURL);
      newURL.searchParams.delete("t");

      if (!tempFrag && time > 0) {
        tempFrag = { start: time, end: -1 };
      }

      if (tempFrag && isTimestamp(tempFrag)) {
        newURL.searchParams.set("t", String(tempFrag.start));
      }
      updateHash(newURL, tempFrag);

      return {
        type: SupportedWebHost.Bilibili,
        url: newURL.href,
        hash: newURL.hash,
        noHash: noHash(newURL),
      };
    }
    default:
      return {
        type: SupportedWebHost.Generic,
        url: url.href,
        hash: url.hash,
        noHash: noHash(url),
      };
  }
}

function parseTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
