export enum Host {
  YouTube,
  Bilibili,
  Vimeo,
}

type mediaType = "audio" | "video";
const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "webm", "ogv"]],
]);

function getMediaType(url: URL): mediaType | null {
  // if url contains no extension, type = null
  let fileType: mediaType | null = null;
  if (url.pathname.includes(".")) {
    const ext = url.pathname.split(".").pop() as string;
    for (const [type, extList] of acceptedExt) {
      if (extList.includes(ext)) fileType = type;
    }
  }
  return fileType;
}

export type videoInfo = videoInfo_Direct | videoInfo_Host;
export interface videoInfo_Direct {
  src: URL;
  type: mediaType;
}
export function isDirect(info: videoInfo): info is videoInfo_Direct {
  return (info as videoInfo_Host).host === undefined;
}
export interface videoInfo_Host {
  host: Host;
  id: string;
  iframe: URL;
  src: URL;
}

export function getVideoInfo(src: URL): videoInfo | null {
  const mediaType = getMediaType(src);
  if (mediaType) return { src, type: mediaType };

  switch (src.hostname) {
    case "www.bilibili.com":
      if (src.pathname.startsWith("/video")) {
        let videoId = src.pathname.replace("/video/", "");
        let queryStr: string;
        if (/^bv/i.test(videoId)) {
          queryStr = `?bvid=${videoId}`;
        } else if (/^av/i.test(videoId)) {
          queryStr = `?aid=${videoId}`;
        } else {
          console.log(`invaild video id: ${videoId}`);
          return null;
        }
        let page = src.searchParams.get("p");
        if (page) queryStr += `&page=${page}`;
        return {
          host: Host.Bilibili,
          id: videoId,
          iframe: new URL(
            `https://player.bilibili.com/player.html${queryStr}&high_quality=1&danmaku=0`,
          ),
          src,
        };
      } else {
        console.log("bilibili video url not supported or invalid");
        return null;
      }
      break;
    case "www.youtube.com":
    case "youtu.be":
      if (src.pathname === "/watch") {
        let videoId = src.searchParams.get("v");
        if (videoId) {
          return {
            host: Host.YouTube,
            id: videoId,
            iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
            src,
          };
        } else {
          console.log(`invalid video id: ${src.toString()}`);
          return null;
        }
      } else if (src.host === "youtu.be") {
        if (/^\/[^\/]+$/.test(src.pathname)) {
          let videoId = src.pathname.substring(1);
          return {
            host: Host.YouTube,
            id: videoId,
            iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
            src,
          };
        } else {
          console.log(`invalid video id: ${src.toString()}`);
          return null;
        }
      } else {
        console.log("youtube video url not supported or invalid");
        return null;
      }
      break;
    case "vimeo.com":
      const path = src.pathname;
      let match;
      if ((match = path.match(/^\/(\d+)$/))) {
        let videoId = match[1];
        return {
          host: Host.Vimeo,
          id: videoId,
          iframe: new URL(`https://player.vimeo.com/video/${videoId}`),
          src,
        };
      } else {
        console.log("vimeo video url not supported or invalid");
        return null;
      }
    default:
      console.log("unsupported video host");
      return null;
  }
}
