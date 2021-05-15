import Plyr from "plyr";
import {
  defaultPlyrOption,
  getSetupTool,
  Plyr_TF,
  setRatio,
} from "../playerSetup";

export enum Host {
  YouTube,
  Bilibili,
  Vimeo,
}

export const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

export interface videoInfo {
  host: Host;
  id: string;
  iframe: URL;
  src: URL;
}

export function getVideoInfo(src: URL): videoInfo | null {
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

function getIFrame(info: videoInfo) {
  return createEl("iframe", {
    cls: "external-video",
    attr: {
      src: info.iframe.toString(),
      scrolling: "no",
      border: "0",
      frameborder: "no",
      framespacing: "0",
      allowfullscreen: false,
      sandbox:
        "allow-forms allow-presentation allow-same-origin allow-scripts allow-modals",
    },
  });
}

export function setupPlyr(container: HTMLDivElement, info: videoInfo): Plyr_TF {
  const iframe = getIFrame(info);

  const plyrDiv = container.appendChild(
    createDiv({ cls: "plyr__video-embed" }),
  );
  plyrDiv.appendChild(iframe);

  const { loop, timeSpan, setHashOpt, setPlayerTF } = getSetupTool(info.src);
  let youtube: any;
  if (info.host === Host.YouTube) {
    youtube = {
      // set start time
      start: timeSpan && timeSpan.start !== 0 ? timeSpan.start : undefined,
      loop: +loop,
    };
  }
  // @ts-ignore
  Plyr.timeSpan = null;
  const player = new Plyr(plyrDiv, {
    ...defaultPlyrOption,
    loop: { active: loop },
    youtube,
  }) as Plyr_TF;
  setRatio(container, player);
  setHashOpt(player);
  setPlayerTF(player);
  return player;
}

export function setupIFrame(container: HTMLDivElement, info: videoInfo): void {
  container.appendChild(getIFrame(info));
  container.addClass("bili-embed");
}
