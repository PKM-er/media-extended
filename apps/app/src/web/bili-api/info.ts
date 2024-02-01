/* eslint-disable @typescript-eslint/naming-convention */
import { BiliApiError } from "./base";
import type { BilibiliApiContext, Aid, Bvid } from "./base";

export async function basicInfo(id: Aid | Bvid, ctx: BilibiliApiContext) {
  const api = new URL("https://api.bilibili.com/x/web-interface/view");
  if ("aid" in id) {
    api.searchParams.set("aid", id.aid.toString());
  } else {
    api.searchParams.set("bvid", id.bvid);
  }
  const resp = (await ctx.fetch<VideoInfoResponse>(api)).json;
  if (resp.code !== 0) {
    throw new BiliApiError(resp.message, resp.code);
  }
  return resp.data;
}

const enum VideoInfoErrorCode {
  Success = 0,
  /** 请求错误 */
  BadRequest = -400,
  /** 权限不足 */
  Forbidden = -403,
  /** 无视频 */
  NotFound = -404,
  /** 稿件不可见 */
  Invisible = 62002,
  /** 稿件审核中 */
  UnderReview = 62004,
}

interface VideoInfoResponseSuccess {
  code: VideoInfoErrorCode.Success;
  message: 0;
  ttl: 1;
  data: VideoInfoData;
}

interface VideoInfoResponseError {
  code: Exclude<VideoInfoErrorCode, VideoInfoErrorCode.Success>;
  message: string;
  ttl: 1;
  data: null;
}

type VideoInfoResponse = VideoInfoResponseSuccess | VideoInfoResponseError;

/**
 * @see https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/info.md
 */
interface VideoInfoData {
  /* 稿件bvid */
  bvid: string;
  /* 稿件avid */
  aid: number;
  /* 稿件分P总数，默认为1 */
  videos: number;
  /* 分区tid */
  tid: number;
  /* 子分区名称 */
  tname: string;
  /* 稿件封面图片url */
  pic: string;
  /* 稿件标题 */
  title: string;
  /* 稿件发布时间，秒级时间戳 */
  pubdate: number;
  /* 用户投稿时间，秒级时间戳 */
  ctime: number;
  /* 视频简介 */
  desc: string;
  /* 视频状态 */
  state: number;
  /* 稿件总时长(所有分P)，单位为秒 */
  duration: number;
  /* 视频属性标志 */
  rights: VideoRights;
  /* 视频UP主信息 */
  owner: VideoOwner;
  /* 视频状态数 */
  stat: VideoStat;
  /* 视频同步发布的的动态的文字内容 */
  dynamic: string;
  /* 视频1P cid */
  cid: number;
  /* 视频1P分辨率 */
  dimension: VideoDimension;
  /* 稿件参与的活动id */
  mission_id?: number;
  /* 重定向url，仅番剧或影视视频存在此字段 */
  redirect_url?: string;
  /* 视频分P列表 */
  pages: VideoPage[];
  [key: string]: any;
}

interface VideoRights {
  /* 是否允许承包 */
  bp: number;
  /* 是否支持充电 */
  elec: number;
  /* 是否允许下载 */
  download: number;
  /* 是否电影 */
  movie: number;
  /* 是否PGC付费 */
  pay: number;
  /* 是否有高码率 */
  hd5: number;
  /* 是否显示“禁止转载”标志 */
  no_reprint: number;
  /* 是否自动播放 */
  autoplay: number;
  /* 是否UGC付费 */
  ugc_pay: number;
  /* 是否为联合投稿 */
  is_cooperation: number;
  /* 作用尚不明确 */
  ugc_pay_preview: number;
  /* 作用尚不明确 */
  no_background: number;
  /* 作用尚不明确 */
  clean_mode: number;
  /* 是否为互动视频 */
  is_stein_gate: number;
  /* 是否为全景视频 */
  is_360: number;
  /* 作用尚不明确 */
  no_share: number;
  /* 作用尚不明确 */
  arc_pay: number;
  /* 作用尚不明确 */
  free_watch: number;
}

interface VideoOwner {
  /* UP主mid */
  mid: number;
  /* UP主昵称 */
  name: string;
  /* UP主头像 */
  face: string;
}

interface VideoStat {
  /* 稿件avid */
  aid: number;
  /* 播放数 */
  view: number;
  /* 弹幕数 */
  danmaku: number;
  /* 评论数 */
  reply: number;
  /* 收藏数 */
  favorite: number;
  /* 投币数 */
  coin: number;
  /* 分享数 */
  share: number;
  /* 当前排名 */
  now_rank: number;
  /* 历史最高排行 */
  his_rank: number;
  /* 获赞数 */
  like: number;
  /* 点踩数，恒为`0` */
  dislike: number;
  /* 视频评分 */
  evaluation: string;
  /* 作用尚不明确 */
  vt: number;
}

interface VideoDimension {
  /* 当前分P 宽度 */
  width: number;
  /* 当前分P 高度 */
  height: number;
  /* 是否将宽高对换，0：正常，1：对换 */
  rotate: number;
}

interface VideoPage {
  /* 分P cid */
  cid: number;
  /* 分P序号，从1开始 */
  page: number;
  /* 视频来源 */
  from: string;
  /* 分P标题 */
  part: string;
  /* 分P持续时间，单位为秒 */
  duration: number;
  /* 当前分P分辨率 */
  dimension: VideoDimension;
  /* 站外视频vid */
  vid?: string;
  /* 站外视频跳转url */
  weblink?: string;
  /* 分P封面 */
  first_frame?: string;
}
