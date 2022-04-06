// @ts-nocheck
import "dashjs/dist/dash.all.debug";

import { getLink, MediaInfo } from "@base/media-info";
import type MediaExtended from "@plugin";
import { recToPlyrControls } from "@settings";
import assertNever from "assert-never";
import type dashjs from "dashjs";
import { around } from "monkey-around";
import { HashTool, MediaInfoType, MediaType, Plyr_TF, TimeSpan } from "mx-lib";
import { Vault } from "obsidian";
import Plyr from "plyr";

import { fetchPosterFunc, getPort } from "../feature/bili-bridge";

const getYtbOptions = (timeSpan: TimeSpan | null, useYtControls: boolean) => {
  let options: Plyr.Options = {};
  if (timeSpan && timeSpan.start !== 0) {
    if (!options.youtube) options.youtube = {};
    // @ts-ignore
    options.youtube.start = timeSpan.start;
  }
  if (useYtControls) {
    if (!options.youtube) options.youtube = {};
    options.controls = ["play-large"];
    // @ts-ignore
    options.youtube.controls = true;
  }
  return options;
};

export const getPlyr = (
  info: MediaInfo,
  plugin: MediaExtended,
  changeOpts?: (options: Plyr.Options) => void,
): Plyr_TF => {
  const hashTool = new HashTool(info.hash);

  const { app } = plugin;
  const { useYoutubeControls } = plugin.settings;

  const isYtb = info.from === MediaInfoType.Host && info.host === "youtube";
  const ytbOptions = isYtb
    ? getYtbOptions(hashTool.timeSpan, useYoutubeControls)
    : null;
  const defaultPlyrOption: Plyr.Options = {
    invertTime: false,
    controls: recToPlyrControls(plugin.sizeSettings.plyrControls),
  };
  let options = { ...defaultPlyrOption, ...ytbOptions };
  if (changeOpts) changeOpts(options);
  options.autoplay = hashTool.is("autoplay");

  const playerEl = createDiv().appendChild(createEl("video"));
  const player = new Plyr(playerEl, options);

  if (
    info.from === MediaInfoType.Host &&
    info.host === "bilibili" &&
    info.iframe
  ) {
    const { iframe, id } = info,
      vid = iframe.searchParams.has("aid") ? "av" + id : id,
      page = info.src.searchParams.get("p");
    // @ts-ignore
    const dash = dashjs.MediaPlayer().create();
    const src = new URL("http://localhost/geturl/" + vid);
    src.port = getPort(app).toString();
    if (page) src.searchParams.append("page", page);
    dash.initialize(playerEl, src.toString(), false);
    around(player, {
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      destroy(next) {
        return function (this: any) {
          dash.destroy();
          next.call(this);
        };
      },
    });
    const fetchBiliPoster = fetchPosterFunc(app);
    const getPoster = async () => {
      const posterUrl = iframe.searchParams.has("aid")
        ? await fetchBiliPoster(+id)
        : await fetchBiliPoster(id);
      if (posterUrl) player.poster = posterUrl;
      else console.error("unable to fetch poster");
    };
    getPoster();
  } else {
    const source = infoToSource(info, app.vault);
    player.source = source;
    (player as Plyr_TF).sourceBak = source;
  }

  hashTool.initPlayer(player);
  hashTool.applyAttrs(player);
  if (info.from === MediaInfoType.Obsidian && info.subtitles.length > 0) {
    // hide poster to make subtitle selectable
    const posterEl: HTMLElement | undefined = (player.elements as any).poster;
    if (posterEl) posterEl.addClass("visuallyhidden");
    else console.error("unable to find posterEl from", player.elements);

    player.once("ready", () => player.toggleCaptions());
  }

  checkMediaType(info, player);

  // setup youtube
  const container = getContainer(player);
  if (useYoutubeControls) container.classList.add("yt-controls");
  if (isYtb && useYoutubeControls) {
    player.on("ready", async () => {
      await player.play();
      player.pause();
    });
  }

  return player as Plyr_TF;
};

/** check media type that can not be determined by extension and switch source accordingly */
export const checkMediaType = (info: MediaInfo, player: Plyr) => {
  if (
    info.from !== MediaInfoType.Host &&
    info.type === MediaType.Unknown &&
    player.isHTML5
  ) {
    // using plyr.source setter to update will trigger event twice
    let count = 0;
    const handler = () => {
      // @ts-ignore
      const media: HTMLElement = player.media;
      if (media && media instanceof HTMLVideoElement) {
        if (count === 0) {
          if (media.videoHeight !== 0 || media.videoWidth !== 0) {
            player.off("loadedmetadata", handler);
            (player as Plyr_TF).sourceBak.type = "video";
          } else {
            count++;
          }
        } else {
          player.off("loadedmetadata", handler);
          if (media.videoHeight === 0 && media.videoWidth === 0) {
            (player as Plyr_TF).sourceBak.type = "audio";
            console.log("media is audio, switching...");
            const isPlaying = player.playing;
            player.source = (player as Plyr_TF).sourceBak;
            if (isPlaying) player.once("canplay", () => player.play());
            // @ts-ignore reset height from ratio setup
            getContainer(player).style.height = null;
          } else {
            (player as Plyr_TF).sourceBak.type = "video";
          }
        }
      }
    };
    player.on("loadedmetadata", handler);
  }
};

export const infoToSource = (
  info: MediaInfo,
  vault: Vault,
): Plyr.SourceInfo => {
  if (info.from === MediaInfoType.Host) {
    if (info.host === "bilibili")
      throw new Error("Bilibili not supported in Plyr");
    else
      return {
        type: "video",
        sources: [{ src: info.id, provider: info.host as "vimeo" | "youtube" }],
      };
  } else {
    const type = info.type === MediaType.Unknown ? "video" : info.type;
    if (info.from === MediaInfoType.Direct) {
      return {
        type,
        sources: [{ src: getLink(info).href }],
      };
    } else if (info.from === MediaInfoType.Obsidian) {
      if (info.subtitles.length > 0 && info.trackInfo === undefined)
        throw new Error("trackInfo not updated");
      else
        return {
          type,
          sources: [{ src: info.resourcePath }],
          tracks: info.trackInfo ? info.trackInfo.tracks : undefined,
        };
    } else {
      assertNever(info);
    }
  }
};

export const getContainer = (player: Plyr): HTMLDivElement => {
  const container = player.elements.container as HTMLDivElement | null;
  if (container) return container;
  else throw new Error("Plyr container null");
};
