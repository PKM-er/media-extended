import assertNever from "assert-never";
import axios from "axios";
import { videoInfo_Host, Host } from "modules/video-info";

const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

export async function setupPlaceholder(
  info: videoInfo_Host,
  getRealPlayer: () => HTMLDivElement,
): Promise<HTMLDivElement> {
  const { id: videoId } = info;

  const placeholder = createDiv({
    cls: ["placeholder", "plyr plyr--full-ui plyr--video"],
  });
  let placeholderUrl: string | null;

  switch (info.host) {
    case Host.youtube:
      placeholderUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      break;
    case Host.bili:
      if (info.id.startsWith("av"))
        placeholderUrl = await fetchBiliPoster(+info.id.substring(2));
      else placeholderUrl = await fetchBiliPoster(info.id);
      break;
    case Host.vimeo:
      placeholderUrl = await fetchVimeoPoster(info.src);
      break;
    default:
      assertNever(info.host);
  }

  if (placeholderUrl)
    placeholder.style.backgroundImage = `url("${placeholderUrl}")`;
  placeholder.appendChild(
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
        button.onClickEvent(() => placeholder.replaceWith(getRealPlayer()));
      },
    ),
  );

  return placeholder;
}

async function fetchVimeoPoster(url: string | URL): Promise<string | null> {
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

export const fetchBiliPoster = async (
  ...args: [aid: number] | [bvid: string]
): Promise<string | null> => {
  const [id] = args;

  const api = new URL("http://api.bilibili.com/x/web-interface/view");
  if (typeof id === "string") api.searchParams.append("bvid", id);
  else api.searchParams.append("aid", "av" + id);

  return axios
    .get(api.toString(), {
      headers: {
        Origin: "https://www.bilibili.com",
        Referer: "https://www.bilibili.com",
        "Content-Length": "0",
      },
    })
    .then((response) => {
      const json = response.data;
      if (json.code !== 0) throw new Error(`${json.code}: ${json.message}`);
      else {
        return (json.data.pic as string) ?? null;
      }
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
};
