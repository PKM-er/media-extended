import { MediaInfoType } from "../defs";
import { HostInfoHandler } from "../media-info";

const host = "bilibili",
  from = MediaInfoType.Host;

const BilibiliHandler: HostInfoHandler = (src) => {
  if (src.hostname !== "www.bilibili.com") return null;
  if (src.pathname.startsWith("/video")) {
    let videoId = src.pathname.replace("/video/", "");
    let queryStr: string;
    if (/^bv/i.test(videoId)) {
      queryStr = `?bvid=${videoId}`;
    } else if (/^av/i.test(videoId)) {
      videoId = videoId.substring(2);
      queryStr = `?aid=${videoId}`;
    } else {
      console.log(`invaild video id: ${videoId}`);
      return null;
    }
    let page = src.searchParams.get("p");
    if (page) queryStr += `&page=${page}`;
    return {
      from,
      host,
      id: videoId,
      src,
      iframe: new URL(
        `https://player.bilibili.com/player.html${queryStr}&high_quality=1&danmaku=0`,
      ),
      hash: src.hash,
    };
  } else {
    console.log("bilibili video url not supported or invalid");
    return null;
  }
};
export default BilibiliHandler;
