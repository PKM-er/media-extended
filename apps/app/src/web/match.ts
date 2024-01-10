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

export function matchHost(link: string | undefined): {
  type: SupportedWebHost;
  url: string;
  hash: string;
} | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    switch (true) {
      case url.hostname.endsWith(".bilibili.com"):
      case url.hostname === "b23.tv": {
        let hash = url.hash;
        const tempFrag = parseTempFrag(hash);
        const time = getTimeFromBilibiliUrl(url);
        if (!tempFrag && !Number.isNaN(time)) {
          hash += `&t=${time}`;
          url.searchParams.delete("t");
        }
        return {
          type: SupportedWebHost.Bilibili,
          url: url.href,
          hash,
        };
      }
      default:
        return {
          type: SupportedWebHost.Generic,
          url: url.href,
          hash: url.hash,
        };
    }
  } catch {
    // ignore
  }
  return {
    type: SupportedWebHost.Generic,
    url: link,
    hash: "",
  };
}

function getTimeFromBilibiliUrl(url: URL) {
  const _time = url.searchParams.get("t");
  const time = _time ? Number(_time) : NaN;
  if (Number.isNaN(time)) return NaN;
  return time;
}
