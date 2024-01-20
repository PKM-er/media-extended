/* eslint-disable @typescript-eslint/naming-convention */
import type { RequestUrlParam } from "obsidian";
import { Platform, requestUrl } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";
import { getUserAgent } from "../ua";

export async function modifyBilibiliSession(session: Electron.Session) {
  // default to 1080p resolution
  // https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md#qn%E8%A7%86%E9%A2%91%E6%B8%85%E6%99%B0%E5%BA%A6%E6%A0%87%E8%AF%86
  await session.cookies.set({
    url: "https://www.bilibili.com",
    domain: ".bilibili.com",
    path: "/",
    name: "CURRENT_QUALITY",
    value: "80",
    expirationDate: Date.now() + 1e3 * 60 * 60 * 24 * 365,
  });
}

export async function buildFetchForBilibili(appId: string) {
  if (!Platform.isDesktopApp) throw new Error("Not desktop app");
  const session =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@electron/remote").session as typeof Electron.Session;
  const cookies = session.fromPartition(getPartition(appId)).cookies;
  return async function bilibiliFetch(
    url: string,
    {
      requireLogin,
      headers,
      ...init
    }: Omit<RequestUrlParam, "url"> & { requireLogin?: boolean } = {},
  ) {
    let biliHeaders;
    if (!requireLogin) {
      biliHeaders = await getBilibiliHeader(null);
    } else {
      const token = await getBilibiliToken(cookies);
      if (!token) throw new BilibiliLoginError();
      biliHeaders = await getBilibiliHeader(token);
    }
    return requestUrl({
      url,
      headers: { ...headers, ...biliHeaders },
      ...init,
    });
  };
}

export class BilibiliLoginError extends Error {
  constructor() {
    super("Bilibili not logged in");
  }
}

async function getBilibiliToken(
  cookies: Electron.Cookies,
): Promise<string | null> {
  const found = await cookies.get({
    url: "https://www.bilibili.com",
    name: "SESSDATA",
    domain: ".bilibili.com",
    httpOnly: true,
    secure: true,
  });
  if (found.length === 0) return null;
  return found[0].value;
}

async function getBilibiliHeader(token: string | null) {
  const authHeader: Record<string, string> = token
    ? { Cookie: `SESSDATA=${token}` }
    : {};
  return {
    ...authHeader,
    "User-Agent": getUserAgent(navigator.userAgent),
    Origin: "https://www.bilibili.com",
    Referer: "https://www.bilibili.com/",
  } satisfies HeadersInit;
}
