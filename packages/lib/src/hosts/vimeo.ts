import { MediaInfoType } from "../defs";
import { HostInfoHandler } from "../media-info";

const host = "vimeo",
  from = MediaInfoType.Host;

const VimeoHandler: HostInfoHandler = (src) => {
  if (src.hostname !== "vimeo.com") return null;
  const path = src.pathname;
  let match;
  if ((match = path.match(/^\/(\d+)$/))) {
    let videoId = match[1];
    return {
      from,
      host,
      id: videoId,
      iframe: new URL(`https://player.vimeo.com/video/${videoId}`),
      src,
      hash: src.hash,
    };
  } else {
    console.log("vimeo video url not supported or invalid");
    return null;
  }
};
export default VimeoHandler;
