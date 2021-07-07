import assertNever from "assert-never";
import https from "https";
import { getContainer, getPlyrForHost } from "modules/player-setup";
import { setupIFrame } from "./iframe";
import { videoInfo_Host, Host } from "modules/video-info";

const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

export async function setupThumbnail(
  info: videoInfo_Host,
  useYtControls = false,
): Promise<HTMLDivElement> {
  const { id: videoId } = info;

  const thumbnail = createDiv({
    cls: ["thumbnail", "plyr plyr--full-ui plyr--video"],
  });
  let thumbnailUrl: string | null;
  let fakePlayHandler: typeof PlyrHandler;
  function PlyrHandler() {
    const player = getPlyrForHost(info, useYtControls);
    player.once("ready", function (evt) {
      this.play();
    });
    thumbnail.replaceWith(getContainer(player));
  }

  switch (info.host) {
    case Host.youtube:
      thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      fakePlayHandler = PlyrHandler;
      break;
    case Host.bili:
      if (info.id.startsWith("av"))
        thumbnailUrl = await fetchBiliThumbnail(+info.id.substring(2));
      else thumbnailUrl = await fetchBiliThumbnail(info.id);
      fakePlayHandler = () => {
        const div = createDiv();
        setupIFrame(div, info);
        thumbnail.replaceWith(div);
      };
      break;
    case Host.vimeo:
      thumbnailUrl = await fetchVimeoThumbnail(info.src);
      fakePlayHandler = PlyrHandler;
      break;
    default:
      assertNever(info.host);
  }

  if (thumbnailUrl) thumbnail.style.backgroundImage = `url("${thumbnailUrl}")`;
  thumbnail.appendChild(
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

  return thumbnail;
}

export async function fetchVimeoThumbnail(
  url: string | URL,
): Promise<string | null> {
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

export async function fetchBiliThumbnail(aid: number): Promise<string | null>;
export async function fetchBiliThumbnail(bvid: string): Promise<string | null>;
export async function fetchBiliThumbnail(
  id: string | number,
): Promise<string | null> {
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
