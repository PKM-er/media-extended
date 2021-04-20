import assertNever from "assert-never";
import axios from "axios";
import { isBiliVId, returnBody, vidType } from "./general";

// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/info.md#%E6%9F%A5%E8%AF%A2%E8%A7%86%E9%A2%91%E5%88%86p%E5%88%97%E8%A1%A8--aidbvid%E8%BD%ACcid

type pageListData = returnBody<pageInfo[]>

interface pageInfo {
  /** 当前分P CID */
  cid: number;
  /** 当前分P */
  page: number;
  /** 视频来源*/
  from: videoSource;
  /** 当前分P标题 */
  part: string;
  /** 当前分P持续时间	单位为秒 */
  duration: number;
  /** 站外视频vid */
  vid: string;
  /** 站外视频跳转url */
  weblink: string;
  /** 当前分P分辨率	有部分视频无法获取分辨率 */
  dimension?: Dimension;
}

interface Dimension {
  /** 当前分P 宽度 */
  width: number;
  /** 当前分P 高度 */
  height: number;
  /** 是否将宽高对换 0：正常 1：对换 */
  rotate: 0 | 1;
}

const enum videoSource {
  /** 普通上传（B站） */
  vupload = "vupload",
  /** 芒果TV */
  hunan = "hunan",
  /** 腾讯 */
  qq = "qq",
}

interface PageListParams_A {
  /** 稿件avID，为av后的数字 eg. aid=13502509 */
  aid: number;
}

interface PageListParams_B {
  /** 稿件bvID，为完整字符串(包括"bv") eg. bvid=BV1ex411J7GE */
  bvid: string;
}

export type PageListParams = PageListParams_A | PageListParams_B;

/**
 * 查询视频分P列表 (avID转CID)
*/
export async function getPageList(arg: PageListParams) {

  const url = "http://api.bilibili.com/x/player/pagelist";

  // @ts-ignore
  const { aid, bvid } = arg;

  if (
    (aid && isBiliVId(aid) === vidType.avid) ||
    (bvid && isBiliVId(bvid) === vidType.bvid)
  )
    return axios.get<pageListData>(url, { params: arg });
  else throw new TypeError(`Invalid aid ${aid}/bvid ${bvid}`);
}
