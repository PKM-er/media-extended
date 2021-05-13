import { parseTF } from "./tfTools";
import { assertNever } from "assert-never";
import { parse } from "query-string";
import Plyr from "plyr";
import { injectTimestamp, Plyr_TF } from "./playerSetup";

enum Host {
  YouTube,
  Bilibili,
  Vimeo,
}

interface videoInfo {
  host: Host;
  id: string;
  iframe: URL;
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

export function getPlayer(url: URL): HTMLDivElement | null {
  let info = getVideoInfo(url);
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
      sandbox:
        "allow-forms allow-presentation allow-same-origin allow-scripts allow-modals",
    },
  });

  const container = createDiv(undefined, (el) => el.appendChild(iframe));

  switch (info.host) {
    case Host.YouTube:
    case Host.Vimeo: {
      const timeSpan = parseTF(url.hash);
      const isLoop = parse(url.hash).loop === null;

      let ytOpt;
      if (info.host === Host.YouTube) {
        ytOpt = {} as any;
        // set start time
        if (timeSpan && timeSpan.start !== 0) ytOpt.start = timeSpan.start;
        ytOpt.loop = +isLoop;
      }

      container.addClass("plyr__video-embed");
      // @ts-ignore
      Plyr.timeSpan = null;
      const player = new Plyr(container, {
        fullscreen: { enabled: false },
        loop: { active: parse(url.hash).loop === null },
        invertTime: false,
        youtube: ytOpt,
      }) as Plyr_TF;

      if (timeSpan) injectTimestamp(player, timeSpan);

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
