import { parseTempFrag } from "@/lib/hash/temporal-frag";

/* eslint-disable @typescript-eslint/naming-convention */
export enum SupportedWebHost {
  Bilibili = "bilibili",
  Generic = "generic",
}

export const webHostDisplayName: Record<SupportedWebHost, string> = {
  [SupportedWebHost.Bilibili]: "Bilibili",
  [SupportedWebHost.Generic]: "Web",
};

export function noHash(url: URL) {
  return url.hash ? url.href.slice(0, -url.hash.length) : url.href;
}

export function matchHost(link: string | undefined): {
  type: SupportedWebHost;
  url: string;
  hash: string;
  noHash: string;
} | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    switch (true) {
      case url.hostname.endsWith(".bilibili.com"):
      case url.hostname === "b23.tv": {
        const newURL = new URL(url);
        const tempFrag = parseTempFrag(newURL.hash);
        const time = getTimeFromBilibiliUrl(newURL);
        if (time) {
          newURL.searchParams.delete("t");
        }
        if (!tempFrag && !Number.isNaN(time)) {
          newURL.hash += `&t=${time}`;
        }
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
  } catch {
    // ignore
  }
  return {
    type: SupportedWebHost.Generic,
    url: link,
    hash: "",
    noHash: link,
  };
}

function getTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
