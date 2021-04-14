import { HTMLMediaEl_TF, TimeSpan, isHTMLMediaEl_TF } from "./MFParse";
import { assertNever } from "assert-never";
import { stringify, parse } from "query-string";
import { parseLinktext } from "obsidian";

enum Host {
  YouTube,
  Bilibili
}

interface videoInfo {
  host: Host;
  id: string;
  iframe: URL;
}

export function getEmbedInfo(src: URL): videoInfo | null {
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
          console.log(`invaild bilibili video-id: ${videoId}`);
          return null;
        }
        let page = src.searchParams.get("p");
        if (page) queryStr += `&page=${page}`;
        return {
          host: Host.Bilibili,
          id: videoId,
          iframe: new URL(
            `https://player.bilibili.com/player.html${queryStr}&high_quality=1&danmaku=0`
          ),
        };
      } else {
        console.log("not recognized as bilibili video");
        return null;
      }
      break;
    case "www.youtube.com":
      if (src.pathname === "/watch") {
        let videoId = src.searchParams.get("v");
        if (videoId) {
          return {
            host: Host.YouTube,
            id: videoId,
            iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
          };
        } else {
          console.log(`invalid video id host: ${src.toString()}`);
          return null;
        }
      } else {
        console.log("not recognized as youtube video");
        return null;
      }
      break;
    default:
      console.log("unsupported video host");
      return null;
  }
}

export function getEmbedFrom(url:URL): HTMLIFrameElement | null {
  let info = getEmbedInfo(url);
  if (!info) return null;

  switch (info.host) {
    case Host.YouTube:
    case Host.Bilibili:
      return createEl("iframe", {
        attr: {
          class: "external-video",
          src: info.iframe.toString(),
          scrolling: "no",
          border: "0",
          frameborder: "no",
          framespacing: "0",
          allowfullscreen: false,
          sandbox: "allow-forms allow-presentation allow-same-origin allow-scripts allow-modals"
        },
      });  
    default:
      assertNever(info.host)
  }

}

export function injectTimestamp(player: HTMLMediaElement, timeSpan: TimeSpan) {
  (player as HTMLMediaEl_TF).timeSpan = timeSpan;

  // inject media fragment into player's src
  const { path, subpath: hash } = parseLinktext(player.src);
  let hashObj = parse(hash);
  hashObj.t = timeSpan.raw;
  player.src = path + "#" + stringify(hashObj);

  // inject event handler to restrict play range
  player.onplaying = (e) => {
    const player = e.target as HTMLMediaElement;
    if (isHTMLMediaEl_TF(player)) {
      const {
        timeSpan: { start, end },
        currentTime,
      } = player;
      if (currentTime > end || currentTime < start) {
        player.currentTime = start;
      }
    } else {
      console.error(player);
      throw new Error("missing timeSpan in HTMLMediaEl_TF");     
    }
  };
  player.ontimeupdate = (e) => {
    const player = e.target as HTMLMediaElement;
    if (isHTMLMediaEl_TF(player)) {
      const {
        timeSpan: { start, end },
        currentTime,
      } = player;
      // check if is HTMLMediaEl_TF object
      if (currentTime > end) {
        if (!player.loop) {
          player.pause();
        } else {
          player.currentTime = start;
        }
      }
    } else {
      console.error(player);
      throw new Error("missing timeSpan in HTMLMediaEl_TF");     
    }
  };
}