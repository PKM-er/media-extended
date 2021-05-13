import { assertNever } from "assert-never";
import Plyr from "plyr";
import { getSetupTool, Plyr_TF } from "./playerSetup";
import https from "https";

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
      setupThumbnail(container, info);
      return container;
    }
    case Host.Bilibili: {
      setupThumbnail(container, info);
      return container;
    }
    default:
      assertNever(info.host);
  }
}

async function setupThumbnail(
  container: HTMLDivElement,
  info: videoInfo,
): Promise<void> {
  const { id: videoId } = info;

  let thumbnailUrl: string | null;
  let fakePlayHandler: typeof PlyrHandler;
  function PlyrHandler() {
    const player = setupPlyr(container, info);
    player.once("ready", function (evt) {
      this.play();
    });
    container.removeChild(thumbnail);
  }

  switch (info.host) {
    case Host.YouTube:
      thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      fakePlayHandler = PlyrHandler;
      break;
    case Host.Bilibili:
      if (info.id.startsWith("av"))
        thumbnailUrl = await fetchBiliThumbnail(+info.id.substring(2));
      else thumbnailUrl = await fetchBiliThumbnail(info.id);
      fakePlayHandler = () => {
        setupIFrame(container, info);
        container.removeChild(thumbnail);
      };
      break;
    case Host.Vimeo:
      thumbnailUrl = await fetchVimeoThumbnail(info.src);
      fakePlayHandler = PlyrHandler;
      break;
    default:
      assertNever(info.host);
  }

  const thumbnail = createDiv(
    {
      cls: ["thumbnail", "plyr plyr--full-ui plyr--video"],
    },
    (el) => {
      if (thumbnailUrl) el.style.backgroundImage = `url("${thumbnailUrl}")`;
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

function setupIFrame(container: HTMLDivElement, info: videoInfo): void {
  container.appendChild(getIFrame(info));
  container.addClass("bili-embed");
}

async function fetchVimeoThumbnail(url: string | URL): Promise<string | null> {
  const api = new URL("https://vimeo.com/api/oembed.json");
  if (typeof url === "string") api.searchParams.append("url", url);
  else api.searchParams.append("url", url.href);

  return fetch(api.href)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      else return response.json();
    })
    .then((data) => {
      return (data.thumbnail_url as string) ?? null;
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
}

async function fetchBiliThumbnail(aid: number): Promise<string | null>;
async function fetchBiliThumbnail(bvid: string): Promise<string | null>;
async function fetchBiliThumbnail(id: string | number): Promise<string | null> {
  const api = new URL("http://api.bilibili.com/x/web-interface/view");
  if (typeof id === "string") api.searchParams.append("bvid", id);
  else api.searchParams.append("aid", "av" + id);

  const options = {
    method: "GET",
    hostname: api.hostname,
    port: null,
    path: api.pathname + api.search,
    headers: {
      Origin: "https://www.bilibili.com",
      Referer: "https://www.bilibili.com",
      "Content-Length": "0",
    },
  };

  const request = httpRequest(options);

  return request
    .then((json) => {
      if (json.code !== 0) throw new Error(`${json.code}: ${json.message}`);
      else {
        return (json.data.pic as string) ?? null;
      }
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
}

function httpRequest(
  options: string | https.RequestOptions | URL,
  postData?: any,
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    var req = https.request(options, (res) => {
      // reject on bad status
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error("statusCode=" + res.statusCode));
      }
      // cumulate data
      const body: any[] = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on("end", function () {
        try {
          const obj: any = JSON.parse(Buffer.concat(body).toString());
          resolve(obj);
        } catch (e) {
          reject(e);
        }
      });
    });
    // reject on request error
    req.on("error", function (err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    if (postData) {
      req.write(postData);
    }
    // IMPORTANT
    req.end();
  });
}
