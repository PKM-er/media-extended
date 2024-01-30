/* eslint-disable @typescript-eslint/naming-convention */
import type { Aid, Bvid, BilibiliApiContext, Cid } from "./base";
import { BiliApiError } from "./base";

interface SeriesId {
  /** 番剧season_id */
  season_id?: number;
  /** 剧集ep_id */
  ep_id?: number;
}

export async function playerV2(
  id: (Aid | Bvid) & Cid & SeriesId,
  ctx: BilibiliApiContext,
) {
  const api = new URL("https://api.bilibili.com/x/player/v2");
  api.searchParams.set("cid", id.cid.toString());
  if ("aid" in id) {
    api.searchParams.set("aid", id.aid.toString());
  } else {
    api.searchParams.set("bvid", id.bvid);
  }
  if (id.season_id) api.searchParams.set("season_id", id.season_id.toString());
  if (id.ep_id) api.searchParams.set("ep_id", id.ep_id.toString());

  const resp = (await ctx.fetch<PlayerV2Response>(api, { requireLogin: true }))
    .json;
  if (resp.code !== 0) {
    throw new BiliApiError(resp.message, resp.code);
  }
  return resp.data;
}

/* eslint-disable @typescript-eslint/naming-convention */
const enum PlayerV2ErrorCode {
  Success = 0,
  /** 请求错误 */
  BadRequest = -400,
  /** 无视频 */
  NotFound = -404,
}

/**
 * @see https://github.com/SocialSisterYi/bilibili-API-collect/issues/323
 */
export interface PlayerV2Data {
  subtitle: SubtitleInfo;
  need_login_subtitle: boolean;
  aid: number;
  bvid: string;
  cid: number;
  page_no: number;
}

// API响应的根对象
interface PlayerV2ResponseSuccess {
  code: PlayerV2ErrorCode.Success;
  message: 0;
  ttl: number;
  data: PlayerV2Data;
}

interface PlayerV2ResponseError {
  code: Exclude<PlayerV2ErrorCode, PlayerV2ErrorCode.Success>;
  message: string;
  ttl: 1;
  data: null;
}

export type PlayerV2Response = PlayerV2ResponseSuccess | PlayerV2ResponseError;

// Subtitle information details interface
interface SubtitleInfo {
  allow_submit: boolean;
  subtitles: Subtitle[];
}

interface Subtitle {
  id: number;
  lan: string;
  lan_doc: string;
  is_lock: boolean;
  // author_mid: number;
  subtitle_url: string;
}
