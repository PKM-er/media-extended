import axios from "axios";
import { returnBody } from "bili-api/player/general";
import * as Pagelist from "bili-api/player/pagelist"
import * as PlayUrl from "bili-api/player/playurl"

export const enum vidType {
  avid,
  bvid
}

export function isBiliVId(id: string | number): vidType | null {
  if (typeof id === "number" && Number.isInteger(id)) return vidType.avid;
  else if (typeof id === "string" && /^bv/i.test(id)) return vidType.bvid;
  else console.log("Invalid id: " + id);
  return null;
}

export function isDash(obj: PlayUrl.Data): obj is PlayUrl.DashData {
  return (obj as PlayUrl.DashData).dash !== undefined;
}

export function isTrad(obj: PlayUrl.Data): obj is PlayUrl.TradData {
  return (obj as PlayUrl.TradData).durl !== undefined;
}

/**
 * 获取视频流URL（web端）
 * @param F = typeof args.fnval
 */
 export function getPlayUrl<F>(
  args: PlayUrl.Params, cookie?:string
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
      F extends PlayUrl.fetch_method.dash
        ? returnBody<PlayUrl.DashData>
        : returnBody<PlayUrl.TradData>
    >(url, { params: args, headers });
  }

  else throw new TypeError(`Invalid avid ${avid}/bvid ${bvid}`);
}

/**
 * 查询视频分P列表 (avID转CID)
*/
export async function getPageList(arg: Pagelist.Params) {

  const url = "http://api.bilibili.com/x/player/pagelist";

  // @ts-ignore
  const { aid, bvid } = arg;

  if (
    (aid && isBiliVId(aid) === vidType.avid) ||
    (bvid && isBiliVId(bvid) === vidType.bvid)
  )
    return axios.get<Pagelist.Return>(url, { params: arg });
  else throw new TypeError(`Invalid aid ${aid}/bvid ${bvid}`);
}