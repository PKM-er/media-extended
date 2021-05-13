import { assertNever } from "assert-never";
import Plyr from "plyr";
import { getSetupTool, Plyr_TF } from "./playerSetup";

enum Host {
  YouTube,
  Bilibili,
  Vimeo,
}

const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

interface videoInfo {
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

export function getPlayer(url: URL): HTMLDivElement | null {
  let info = getVideoInfo(url);
  if (!info) return null;
  const container = createDiv({ cls: "external-video" });
  switch (info.host) {
    case Host.YouTube: {
      setupThumbnail(container, info);
      return container;
    }
    case Host.Vimeo: {
      setupPlyr(container, info);
      return container;
    }
    case Host.Bilibili: {
      container.appendChild(getIFrame(info));
      container.addClass("bili-embed");
      return container;
    }
    default:
      assertNever(info.host);
  }
}

function setupThumbnail(container: HTMLDivElement, info: videoInfo): void {
  const { id: videoId } = info;

  const thumbnail = createDiv(
    {
      cls: ["thumbnail", "plyr plyr--full-ui plyr--video"],
    },
    (el) => {
      el.style.backgroundImage = `url("https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg")`;
      el.appendChild(
        createEl(
          "button",
          {
            cls: "plyr__control plyr__control--overlaid",
            attr: {
              type: "button",
              "data-plyr": "play",
              "aria-label": "Play",
            },
          },
          (button) => {
            button.innerHTML = playButtonHtml;
            button.onClickEvent(fakePlayHandler);
          },
        ),
      );
    },
  );

  function fakePlayHandler() {
    const player = setupPlyr(container, info);
    player.once("ready", function (evt) {
      this.play();
    });
    container.removeChild(thumbnail);
  }

  container.appendChild(thumbnail);
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

function setupPlyr(container: HTMLDivElement, info: videoInfo): Plyr_TF {
  const iframe = getIFrame(info);

  container.appendChild(iframe);
  const { isLoop, timeSpan, setPlayer } = getSetupTool(info.src);
  container.addClass("plyr__video-embed");
  let youtube: any;
  if (info.host === Host.YouTube) {
    youtube = {
      // set start time
      start: timeSpan && timeSpan.start !== 0 ? timeSpan.start : undefined,
      loop: +isLoop,
    };
  }
  // @ts-ignore
  Plyr.timeSpan = null;
  const player = new Plyr(container, {
    fullscreen: { enabled: false },
    loop: { active: isLoop },
    invertTime: false,
    youtube,
  }) as Plyr_TF;
  if (setPlayer) setPlayer(player);
  return player;
}
