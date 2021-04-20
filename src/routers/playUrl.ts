import { statusCode } from "bili-api/player/general";
import { vidType, getPageList, getPlayUrl, isDash, isTrad } from "../modules/bili-tools"
import * as Pagelist from "bili-api/player/pagelist";
import * as PlayUrl from "bili-api/player/playurl";
import { fetch_method } from "bili-api/player/playurl";
import assertNever from "assert-never";
import { toMPD } from "../modules/dash-tool";
import { RequestHandler } from "express";

type vid = { type: vidType.bvid; value: string } | { type: vidType.avid; value: number };

export const Route = "/geturl/:vid(av\\d+|bv\\w+)";

let Cookie: string | undefined;
let PORT: number;

export function getHandler(port:number=2233,cookie?:string): RequestHandler {
  Cookie = cookie;
  PORT = port;
  const shell: RequestHandler = async (req,res,next) => {
    try {
      getUrl(req,res,next);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  }
  return shell;
}

const getUrl: RequestHandler = async (req,res,next) => {

  const rawId = req.params.vid;

  let id: vid;
  let page: number|null;

  let idValue = rawId.substring(2);
  if (/^av/i.test(rawId) && parseInt(idValue,10))
    id = { type: vidType.avid, value: parseInt(idValue,10) };
  else if (/^bv/i.test(rawId)) id = { type: vidType.bvid, value: idValue };
  else {
    throw new Error("invalid avid/bvid");
  }
      
  const p = req.query.p;
  if (typeof p === "string" && parseInt(p,10)){
    page = parseInt(p,10);
  } else {
    page = null;
    if (p) console.error("invalid p, ignored" + p);
  }

  let cid;

  try {
    cid = await getCid(id, page);
  } catch (error) {
    throw new Error("failed to fetch cid, error:" + error)
  }

  let playData;

  try {
    playData = await getPlayData(id, cid);
  } catch (error) {
    throw new Error("failed to fetch playData, error:" + error);
  }

  const mpd = toMPD(convertToFakeUrl(playData) as PlayUrl.DashData);

  res.set({
    "Content-Type": "application/dash+xml; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  })
  res.send(mpd);

} 

async function getCid(id: vid, page: number | null) {
  let argPl: Pagelist.Params;

  switch (id.type) {
    case vidType.avid:
      argPl = { aid: id.value };
      break;
    case vidType.bvid:
      argPl = { bvid: "BV" + id.value };
      break;
    default:
      assertNever(id);
  }

  const pagelistData = (await getPageList(argPl)).data;

  if (pagelistData.code !== statusCode.success) {
    throw new Error(-pagelistData.code + ": " + pagelistData.message);
  }

  let cid;
  if (page) cid = pagelistData.data[page].cid;
  else cid = pagelistData.data[0].cid;

  return cid;
}

async function getPlayData(id: vid, cid: number) {
  let argPu: PlayUrl.Params;
  switch (id.type) {
    case vidType.avid:
      argPu = { avid: id.value, cid };
      break;
    case vidType.bvid:
      argPu = { bvid: "BV" + id.value, cid };
      break;
    default:
      assertNever(id);
  }

  const fnval = fetch_method.dash;
  argPu.fnval = fnval;

  let playUrlData = (await getPlayUrl<typeof fnval>(argPu, Cookie)).data;

  if (playUrlData.code !== statusCode.success) {
    throw new Error(-playUrlData.code + ": " + playUrlData.message);
  }

  return playUrlData.data;
}

function convertToFakeUrl(obj: PlayUrl.Data) {

  function toFakeUrl(src:string) {
    let {host, pathname, search} = new URL(src);
    return `http://localhost:${PORT}/fake/${host + pathname + search}`
  }

  if (isDash(obj)){
    const irMediaInfo = (info:PlayUrl.mediaInfo) => {
      info.baseUrl = toFakeUrl(info.baseUrl);
      info.base_url = toFakeUrl(info.base_url);
      info.backup_url.forEach((v) => (v = toFakeUrl(v)));
      info.backupUrl.forEach((v) => (v = toFakeUrl(v)));
    }
    obj.dash.audio.forEach(irMediaInfo);
    obj.dash.video.forEach(irMediaInfo);
  } else if (isTrad(obj)){
    obj.durl.forEach(v=>{
      v.url = toFakeUrl(v.url);
      v.backup_url.forEach((url) => (url = toFakeUrl(url)));
    })
  } else {
    assertNever(obj);
  }

  return obj;
}