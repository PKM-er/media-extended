import assertNever from "assert-never";

import { setRatioWidth } from "../misc";
import { Host, videoInfo_Host } from "./video-info";

const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

export const setupPlaceholder = async (
  info: videoInfo_Host,
  height: string,
  getRealPlayer: () => HTMLDivElement,
): Promise<HTMLDivElement> => {
  const placeholderUrl = await getPosterUrl(info);

  const placeholder = createDiv({
    cls: ["placeholder", "plyr plyr--full-ui plyr--video"],
  });

  if (placeholderUrl)
    placeholder.style.backgroundImage = `url("${placeholderUrl}")`;
  setRatioWidth(placeholder, height, 16 / 9);
  placeholder.createEl(
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
  );

  return placeholder;
};

const getPosterUrl = async (info: videoInfo_Host) => {
  const { id: videoId } = info;
  switch (info.host) {
    case Host.youtube:
      return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    case Host.bili:
      return null; // no placeholder for bili videos
    case Host.vimeo:
      return await fetchVimeoPoster(info.src);
    default:
      assertNever(info.host);
  }
};

const fetchVimeoPoster = async (url: string | URL): Promise<string | null> => {
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
};
