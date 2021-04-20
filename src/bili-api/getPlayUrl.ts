import assertNever from "assert-never";
import axios from "axios";
import { isBiliVId, returnBody, vidType } from "./general";

// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/videostream_url.md

type playUrlData = returnBody<PlayUrl>

export const enum video_quality {
  /** 240P极速（仅mp4方式） */
  _240p = 6,
  /** 360P流畅 */
  _360p = 16,
  /** 480P清晰 */
  _480p = 32,
  /** 720P高清（登录） */
  _720p = 64,
  /** 720P60高清（大会员） */
  _720p60 = 74,
  /** 1080P高清（登录） */
  _1080p = 80,
  /** 1080P+高清（大会员） */
  _1080pPlus = 112,
  /** 1080P60高清（大会员） */
  _1080p60 = 116,
  /** 4K超清（大会员）（需要fourk=1） */
  _4K = 120,
}
export const enum fourk {
  max1080p = 0,
  max4k = 1,
}
export const enum fetch_method {
  /** flv方式（可能会有分段） */
  flv0 = 0,
  flv2 = 2,
  /** 低清mp4方式（仅240P与360P，且限速65K/s） */
  mp4 = 1,
  /** dash方式（音视频分流，支持H.265）*/
  dash = 16,
}
export const enum audio_quality {
  _64k = 30216,
  _132k = 30232,
  _192k = 30280,
}

export interface PlayUrl_Basic {
  /** 作用尚不明确 */
  from: "local";
  /** 作用尚不明确 */
  result: "suee";
  /** 作用尚不明确 */
  message: "";
  /** 当前的视频分辨率代码 值含义见上表 */
  quality: video_quality;
  /** 视频格式  */
  format: string;
  /** 视频长度 单位为毫秒 不同分辨率/格式可能有略微差异 */
  timelength: number;
  /** 视频支持的全部格式 每项用,分隔 */
  accept_format: string;
  /** 视频支持的分辨率列表  */
  accept_description: Array<string>;
  /** 视频支持的分辨率代码列表 值含义见上表 */
  accept_quality: Array<video_quality>;
  /** 作用尚不明确 */
  video_codecid: 7;
  /**  作用尚不明确 */
  seek_param: "start";
  /** ？？？ 作用尚不明确 */
  seek_type: string;
}

export interface PlayUrl_Trad extends PlayUrl_Basic{
  /** 视频分段 注：仅flv/mp4存在此项 仅flv方式具有分段(length>1) */
  durl: durlInfo[];
}

interface durlInfo {
  /** 视频分段序号 某些视频会分为多个片段（从1顺序增长） */
  order: number;
  /** 视频长度 单位为毫秒 */
  length: number;
  /** 视频大小 单位为Byte */
  size: number;
  /** 作用尚不明确 */
  ahead: "";
  /** 作用尚不明确 */
  vhead: "";
  /** 视频流url url内容存在转义符 有效时间为120min */
  url: string;
  /** 备用视频流 url内容存在转义符 有效时间为120min */
  backup_url: string[];
}

export interface PlayUrl_Dash extends PlayUrl_Basic{
  /** dash音视频流信息 注：仅dash存在此项 */
  dash: {
    /** 作用尚不明确 */
    duration: number;
    /** 作用尚不明确 */
    minBufferTime: number;
    /** 作用尚不明确 */
    min_buffer_time: number;
    /** 视频流信息 */
    video: videoInfo[];
    /** 音频流信息 */
    audio: audioInfo[];
  }
}

export type PlayUrl = PlayUrl_Dash | PlayUrl_Trad;

export function isDash(obj: PlayUrl): obj is PlayUrl_Dash {
  return (obj as PlayUrl_Dash).dash !== undefined;
}

export function isTrad(obj: PlayUrl): obj is PlayUrl_Trad {
  return (obj as PlayUrl_Trad).durl !== undefined;
}

export interface audioInfo extends mediaInfo {
  /** 清晰度代码 */
  id: audio_quality;
}

export interface videoInfo extends mediaInfo {
  /** 清晰度代码 */
  id: video_quality;
  /** 视频宽度 单位为像素 */
  width: number;
  /** 视频高度 单位为像素 */
  height: number;
  /** 视频帧率 */
  frameRate: string;
  /** 视频帧率 */
  frame_rate: string;
}

export interface mediaInfo {
  /** 默认视频/音频流url 注：url内容存在转义符 有效时间为120min */
  baseUrl: string;
  /** 默认视频/音频流url 注：url内容存在转义符 有效时间为120min */
  base_url: string;
  /** 备用视频/音频流url 注：url内容存在转义符 有效时间为120min */
  backupUrl: string[];
  /** 备用视频/音频流url 注：url内容存在转义符 有效时间为120min */
  backup_url: string[];
  /** 视频/音频所需最低带宽 */
  bandwidth: number;
  /** 视频/音频格式类型 */
  mimeType: string;
  /** 视频/音频格式类型 */
  mime_type: string;
  /** 编码/音频类型 */
  codecs: string;
  /** Dash参数 */
  sar: "1:1";
  /** Dash参数 */
  startWithSap: number;
  /** Dash参数 */
  start_with_sap: number;
  /** Dash参数 */
  SegmentBase: {
    "Initialization": string;
    "indexRange": string;
  };
  /** Dash参数 */
  segment_base: {
    "initialization": string;
    "index_range": string;
  };
  /** Dash参数 */
  codecid: number;
}

interface PlayUrlParams_Basics {
  /** 视频CID */
  cid: number;
  /** 视频清晰度选择(dash方式无效) 未登录默认32（480P）登录默认64（720P） */
  qn?: video_quality;
  /** 视频获取方式选择 默认为flv0 */
  fnval?: fetch_method;
  /** 是否允许4K视频 默认为max1080p */
  fourk?: fourk;
  fnver?: 0;
};

interface PlayUrlParams_A extends PlayUrlParams_Basics{
  /** 稿件avID，为av后的数字 eg. aid=13502509 */
  avid: number;
}

interface PlayUrlParams_B extends PlayUrlParams_Basics{
  /** 稿件bvID，为完整字符串(包括"bv") eg. bvid=BV1ex411J7GE */
  bvid: string;
}

export type PlayUrlParams = PlayUrlParams_A | PlayUrlParams_B;

/**
 * 获取视频流URL（web端）
 * @param F = typeof args.fnval
 */
export function getPlayUrl<F>(
  args: PlayUrlParams, cookie?:string
) {
  const url = "http://api.bilibili.com/x/player/playurl";

  // @ts-ignore
  const { avid, bvid } = args;

  if (
    (avid && isBiliVId(avid) === vidType.avid) ||
    (bvid && isBiliVId(bvid) === vidType.bvid)
  ){
    let headers : any = {};
    if (cookie) headers.Cookie = cookie;
    return axios.get<
      F extends fetch_method.dash
        ? returnBody<PlayUrl_Dash>
        : returnBody<PlayUrl_Trad>
    >(url, { params: args, headers });
  }

  else throw new TypeError(`Invalid avid ${avid}/bvid ${bvid}`);
}
