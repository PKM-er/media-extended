import { HTMLMediaEl_TF, TimeSpan, isHTMLMediaEl_TF, parseTF } from "./MFParse";
import { assertNever } from "assert-never";
import { stringify, parse } from "query-string";
import { parseLinktext } from "obsidian";
import Plyr from "plyr"

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

export function getEmbedFrom(url:URL): HTMLDivElement | null {
  let info = getEmbedInfo(url);
  if (!info) return null;

  const iframe = createEl("iframe", {
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

  const container = createDiv(undefined, (el) => el.appendChild(iframe));

  switch (info.host) {
    case Host.YouTube: {
      const timeSpan = parseTF(url.hash);

      let ytOpt = {} as any
      if (timeSpan && timeSpan.start !== 0) ytOpt.start = timeSpan.start;

      let isLoop = parse(url.hash).loop === null;
      ytOpt.loop = +isLoop;

      container.addClass("plyr__video-embed");
      // @ts-ignore
      Plyr.timeSpan = null;
      const player = new Plyr(container, {
        fullscreen: { enabled: false },
        loop: { active: isLoop },
        invertTime: false,
        youtube: ytOpt,
      }) as Plyr_TF;

      if (timeSpan) injectTimestamp(player,timeSpan);

      return container;
    }
    case Host.Bilibili: {
      container.addClass("bili-embed");
      return container;
    }
    default:
      assertNever(info.host);
  }

}

export interface Plyr_TF extends Plyr {
  timeSpan: TimeSpan | null;
}

type Player_TF = HTMLMediaEl_TF | Plyr_TF;
type Player = HTMLMediaElement | Plyr;


/**
 * inject media fragment into player's src
 * @param player an <audio> or <video> element
 */
function setStartTime(player: HTMLMediaEl_TF): void
function setStartTime(player: HTMLMediaElement, timeSpan: TimeSpan): void
function setStartTime(player: HTMLMediaElement, timeSpan?: TimeSpan): void{

  if (isHTMLMediaEl_TF(player)){
    timeSpan = player.timeSpan;
  }
  if (!timeSpan) throw new Error("timespan not found");

  const { path, subpath: hash } = parseLinktext(player.src);
  let hashObj = parse(hash);
  hashObj.t = timeSpan.raw;
  player.src = path + "#" + stringify(hashObj);

}

export function injectTimestamp(player: Player_TF, timeSpan: TimeSpan) {
  player.timeSpan = timeSpan;
  player = player as any;

  if(player instanceof HTMLMediaElement){
    setStartTime(player,timeSpan);
  }

  // inject event handler to restrict play range
  const onplaying = (e: Event) => {
    if (!player.timeSpan) throw new Error("timeSpan not found");
    
    const {
      timeSpan: { start, end },
      currentTime,
    } = player;
    if (currentTime > end || currentTime < start) {
      player.currentTime = start;
    }
  };
  const ontimeupdate = (e: Event) => {
    if (!player.timeSpan) throw new Error("timeSpan not found");

    const {
      timeSpan: { start, end },
      currentTime,
    } = player;
    if (currentTime > end) {
      if (!player.loop) {
        player.pause();
      } else {
        player.currentTime = start;
      }
    }
  };
  if (player instanceof HTMLMediaElement) {
    player.onplaying = onplaying;
    player.ontimeupdate = ontimeupdate;
  } else {
    player.on("playing", onplaying);
    player.on("timeupdate", ontimeupdate);
  }
}