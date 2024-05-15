/* eslint-disable @typescript-eslint/naming-convention */
import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { Platform, requestUrl } from "obsidian";
import { getUserAgent } from "@/lib/remote-player/ua";
import { getSession } from "@/lib/require";

export const enum BilibiliQuality {
  /** 240P 极速
   * 仅 MP4 格式支持
   * 仅`platform=html5`时有效
   */
  LD = 6,

  /** 360P 流畅 */
  SQ = 16,

  /** 480P 清晰 */
  SD = 32,

  /** 720P 高清
   * WEB 端默认值
   * B站前端需要登录才能选择，但是直接发送请求可以不登录就拿到 720P 的取流地址
   * **无 720P 时则为 720P60**
   */
  HD = 64,

  /** 720P60 高帧率
   * 登录认证
   */
  HD_60 = 74,

  /** 1080P 高清
   * TV 端与 APP 端默认值
   * 登录认证
   */
  FHD = 80,

  /** 1080P+ 高码率
   * 大会员认证
   */
  FHD_PLUS = 112,

  /** 1080P60 高帧率
   * 大会员认证
   */
  FHD_60 = 116,

  /** 4K 超清
   * 需要`fnval&128=128`且`fourk=1`
   * 大会员认证
   */
  UHD_4K = 120,

  /** HDR 真彩色
   * 仅支持 DASH 格式
   * 需要`fnval&64=64`
   * 大会员认证
   */
  HDR = 125,

  /** 杜比视界
   * 仅支持 DASH 格式
   * 需要`fnval&512=512`
   * 大会员认证
   */
  DOLBY_VISION = 126,

  /** 8K 超高清
   * 仅支持 DASH 格式
   * 需要`fnval&1024=1024`
   * 大会员认证
   */
  UHD_8K = 127,
}

export const bilibiliQualityLabels: Record<BilibiliQuality, string> = {
  [BilibiliQuality.LD]: "240P 极速",
  [BilibiliQuality.SQ]: "360P 流畅",
  [BilibiliQuality.SD]: "480P 清晰",
  [BilibiliQuality.HD]: "720P 高清",
  [BilibiliQuality.HD_60]: "720P60 高帧率",
  [BilibiliQuality.FHD]: "1080P 高清",
  [BilibiliQuality.FHD_PLUS]: "1080P+ 高码率",
  [BilibiliQuality.FHD_60]: "1080P60 高帧率",
  [BilibiliQuality.UHD_4K]: "4K 超清",
  [BilibiliQuality.HDR]: "HDR 真彩色",
  [BilibiliQuality.DOLBY_VISION]: "杜比视界",
  [BilibiliQuality.UHD_8K]: "8K 超高清",
};

export async function modifyBilibiliSession(
  session: Electron.Session,
  qual: BilibiliQuality,
) {
  // default to 1080p resolution
  // https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md#qn%E8%A7%86%E9%A2%91%E6%B8%85%E6%99%B0%E5%BA%A6%E6%A0%87%E8%AF%86
  await session.cookies.set({
    url: "https://www.bilibili.com",
    domain: ".bilibili.com",
    path: "/",
    name: "CURRENT_QUALITY",
    value: qual.toString(),
    expirationDate: Date.now() + 1e3 * 60 * 60 * 24 * 365,
  });
}

export interface BilibiliFetch {
  <R = any>(
    url: string | URL,
    {
      requireLogin,
      headers,
      ...init
    }?: Omit<RequestUrlParam, "url"> & { requireLogin?: boolean },
  ): Promise<Omit<RequestUrlResponse, "json"> & { json: R }>;
}

export async function buildFetchForBilibili(
  appId: string,
): Promise<BilibiliFetch> {
  if (!Platform.isDesktopApp) throw new Error("Not desktop app");
  const session = getSession(appId);
  if (!session) throw new Error("No session");
  const cookies = session.cookies;
  return async function bilibiliFetch(
    url,
    { requireLogin, headers, ...init } = {},
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
      url: typeof url === "string" ? url : url.toString(),
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
