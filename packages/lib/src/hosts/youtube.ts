import { MediaInfoType } from "../defs";
import { HostInfoHandler } from "../media-info";

const host = "youtube",
  from = MediaInfoType.Host;

const hostnames = ["youtube.com", "www.youtube.com", "youtu.be"];

const YoutubeHandler: HostInfoHandler = (src) => {
  if (!hostnames.includes(src.hostname)) return null;
  if (src.pathname === "/watch") {
    let videoId = src.searchParams.get("v");
    if (videoId) {
      return {
        from,
        host,
        id: videoId,
        iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
        src,
        hash: src.hash,
      };
    } else {
      console.log(`invalid video id: ${src.toString()}`);
      return null;
    }
  } else if (src.host === "youtu.be") {
    if (/^\/[^\/]+$/.test(src.pathname)) {
      let videoId = src.pathname.substring(1);
      return {
        from,
        host,
        id: videoId,
        iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
        src,
        hash: src.hash,
      };
    } else {
      console.log(`invalid video id: ${src.toString()}`);
      return null;
    }
  } else {
    console.log("youtube video url not supported or invalid");
    return null;
  }
};
export default YoutubeHandler;
