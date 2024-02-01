/* eslint-disable @typescript-eslint/naming-convention */

import type { Aid, BilibiliApiContext, Bvid } from "./base";
import { BiliApiError } from "./base";

export async function pagelist(id: Aid | Bvid, ctx: BilibiliApiContext) {
  const api = new URL("https://api.bilibili.com/x/player/v2");
  if ("aid" in id) {
    api.searchParams.set("aid", id.aid.toString());
  } else {
    api.searchParams.set("bvid", id.bvid);
  }
  const resp = (await ctx.fetch<VideoPageListResponse>(api)).json;
  if (resp.code !== 0) {
    throw new BiliApiError(resp.message, resp.code);
  }
  return resp.data;
}

// 视频分P信息的维度对象
interface Dimension {
  /** 当前分P 宽度 */
  width: number; // 宽度
  /** 当前分P 高度 */
  height: number; // 高度
  /** 是否将宽高对换（0：正常，1：对换） */
  rotate: number; // 宽高是否对换
}

// 视频分P信息对象
interface VideoPart {
  /** 当前分P cid */
  cid: number; // 分P的唯一标识
  /** 当前分P序号 */
  page: number; // 分P的顺序号
  /** 视频来源（如vupload：普通上传） */
  from: string; // 视频来源
  /** 当前分P标题 */
  part: string; // 分P的标题
  /** 当前分P持续时间，单位为秒 */
  duration: number; // 分P的持续时间
  /** 站外视频vid（如果有） */
  vid: string; // 站外视频的vid
  /** 站外视频跳转url（如果有） */
  weblink: string; // 站外视频的跳转链接
  /** 当前分P分辨率，有部分视频无法获取分辨率 */
  dimension: Dimension; // 分P的分辨率信息
  /** 分P封面图片url */
  first_frame?: string; // 分P的封面图片，可选字段
}

const enum VideoPageListErrorCode {
  Success = 0,
  /** 请求错误 */
  BadRequest = -400,
  /** 无视频 */
  NotFound = -404,
}

// API响应的根对象
interface VideoPageListResponseSuccess {
  code: VideoPageListErrorCode.Success;
  /** 错误信息 */
  message: 0; // 错误信息
  /** 默认为1 */
  ttl: number; // 默认值为1，作用不详
  /** 分P列表 */
  data: VideoPart[]; // 视频分P列表的数组
}

interface VideoPageListResponseError {
  code: Exclude<VideoPageListErrorCode, VideoPageListErrorCode.Success>;
  message: string;
  ttl: 1;
  data: null;
}

type VideoPageListResponse =
  | VideoPageListResponseSuccess
  | VideoPageListResponseError;
