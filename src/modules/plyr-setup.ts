import "dashjs/dist/dash.all.debug";

import assertNever from "assert-never";
import type dashjs from "dashjs";
import { Vault } from "obsidian";
import Plyr from "plyr";
import { parse } from "query-string";

import MediaExtended from "../mx-main";
import { recToPlyrControls } from "../settings";
import { fetchPosterFunc, getPort } from "./bili-bridge";
import {
  getLink,
  Host,
  isDirect,
  isHost,
  isInternal,
  mediaInfo,
} from "./media-info";
import { parseTF, TimeSpan } from "./temporal-frag";

/** Player with temporal fragments */
export type Player_TF = HTMLMediaEl_TF | Plyr_TF;
export type Player = HTMLMediaElement | Plyr;

interface TemporalFrag {
  readonly timeSpan: TimeSpan | null;
  setTimeSpan(span: TimeSpan | null): void;
  sourceBak: Plyr.SourceInfo;
}

/** Plyr with temporal fragments */
export type Plyr_TF = TemporalFrag & Plyr;
/** HTMLMediaElement with temporal fragments */
export type HTMLMediaEl_TF = TemporalFrag & HTMLMediaElement;

export const isHTMLMediaEl_TF = (
  el: HTMLMediaElement,
): el is HTMLMediaEl_TF => {
  return (
    Boolean((el as HTMLMediaEl_TF).timeSpan) ||
    (el as HTMLMediaEl_TF).timeSpan === null
  );
};

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls";

type setupTool = {
  timeSpan: TimeSpan | null;
  is: (prop: PlayerProperties) => boolean;
  setHashOpt: (player: Player) => void;
  setPlayerTF: (player: Player) => void;
};

export const getSetupTool = (hash: string | null): setupTool => {
  const timeSpan = hash ? parseTF(hash) : null;
  const hashQuery = hash ? parse(hash) : null;
  const getQuery = (query: string) =>
    hashQuery ? hashQuery[query] === null : false;
  // null: exist, with no value (#loop)

  const hashOpts = new Map<string, PlayerProperties>([
    ["loop", "loop"],
    ["mute", "muted"],
    ["play", "autoplay"],
    ["controls", "controls"],
  ]);

  return {
    timeSpan,
    is: (prop) => {
      if (!hash) return false;
      for (const [query, key] of hashOpts) {
        if (prop === key && getQuery(query)) return true;
      }
      return false;
    },
    setPlayerTF: (player) => {
      PlayerTFSetup(player, timeSpan);
    },
    setHashOpt: (player) =>
      hashOpts.forEach((key, query) => {
        if (key === "controls") {
          if (player instanceof HTMLMediaElement && getQuery(query))
            player[key] = true;
        } else if (getQuery(query)) player[key] = true;
      }),
  };
};

export const PlayerTFSetup = (player: Player, timeSpan?: TimeSpan | null) => {
  const playerTF = player as Player_TF;

  /**
   * if current is out of range when start playing,
   * move currentTime back to timeSpan.start
   **/
  const onplaying = (e: Event) => {
    if (!playerTF.timeSpan) return;

    const {
      timeSpan: { start, end },
      currentTime,
    } = playerTF;
    if (currentTime > end || currentTime < start) {
      playerTF.currentTime = start;
    }
  };
  /**
   * if currentTime reaches end, pause video
   * or play at start when loop is enabled
   */
  const ontimeupdate = (e: Event) => {
    if (!playerTF.timeSpan) return;

    const {
      timeSpan: { start, end },
      currentTime,
    } = playerTF;
    if (currentTime > end) {
      if (!playerTF.loop) {
        playerTF.pause();
      } else {
        playerTF.currentTime = start;
        // continue to play in loop
        // if temporal fragment (#t=,2 at the end of src) paused the video
        if (playerTF.paused) playerTF.play();
      }
    }
  };

  /** when update, inject event handler to restrict play range */
  playerTF.setTimeSpan = (span: TimeSpan | null) => {
    // @ts-ignore
    playerTF.timeSpan = span;

    if (span) {
      if (playerTF instanceof HTMLMediaElement && !playerTF.onplaying) {
        (playerTF as HTMLMediaElement).onplaying = onplaying;
        (playerTF as HTMLMediaElement).ontimeupdate = ontimeupdate;
      } else {
        (playerTF as Plyr).on("playing", onplaying);
        (playerTF as Plyr).on("timeupdate", ontimeupdate);
      }
      // set currentTime
      playerTF.currentTime = span.start ?? 0;
    } else {
      if (playerTF instanceof HTMLMediaElement) {
        playerTF.onplaying = null;
        playerTF.ontimeupdate = null;
      } else {
        playerTF.off("playing", onplaying);
        playerTF.off("timeupdate", ontimeupdate);
      }
      // reset currentTime
      playerTF.currentTime = 0;
    }
  };
  playerTF.setTimeSpan(timeSpan ?? null);
};

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
  info: mediaInfo,
  plugin: MediaExtended,
  options?: Plyr.Options,
): Plyr_TF => {
  const { is, setHashOpt, setPlayerTF, timeSpan } = getSetupTool(info.hash);

  const { app } = plugin;
  const { useYoutubeControls, plyrControls } = plugin.settings;

  options = options ?? {};
  const isYtb = isHost(info) && info.host === Host.youtube;
  const ytbOptions = isYtb ? getYtbOptions(timeSpan, useYoutubeControls) : null;
  const defaultPlyrOption: Plyr.Options = {
    invertTime: false,
    controls: recToPlyrControls(plyrControls),
  };
  options = { ...defaultPlyrOption, ...ytbOptions, ...options };
  options.autoplay = is("autoplay");

  const playerEl = createDiv().appendChild(createEl("video"));
  const player = new Plyr(playerEl, options);

  if (isHost(info) && info.host === Host.bili) {
    // @ts-ignore
    const dash = dashjs.MediaPlayer().create();
    const src =
      `http://localhost:${getPort(app)}/geturl/` +
      (info.iframe.searchParams.has("aid") ? "av" + info.id : info.id);
    dash.initialize(playerEl, src, false);
    const fetchBiliPoster = fetchPosterFunc(app);
    const getPoster = async () => {
      const posterUrl = info.iframe.searchParams.has("aid")
        ? await fetchBiliPoster(+info.id)
        : await fetchBiliPoster(info.id);
      if (posterUrl) player.poster = posterUrl;
      else console.error("unable to fetch poster");
    };
    getPoster();
  } else {
    const source = infoToSource(info, app.vault);
    player.source = source;
    (player as Plyr_TF).sourceBak = source;
  }

  setHashOpt(player);
  setPlayerTF(player);
  if (isInternal(info) && info.subtitles.length > 0) {
    // hide poster to make subtitle selectable
    playerEl.querySelector("div.plyr__poster")?.addClass("visuallyhidden");
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
export const checkMediaType = (info: mediaInfo, player: Plyr) => {
  if (!isHost(info) && info.type === "media" && player.isHTML5) {
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
  info: mediaInfo,
  vault: Vault,
): Plyr.SourceInfo => {
  if (isHost(info)) {
    if (info.host === Host.bili)
      throw new Error("Bilibili not supported in Plyr");
    else
      return {
        type: "video",
        sources: [
          { src: info.id, provider: Host[info.host] as "vimeo" | "youtube" },
        ],
      };
  } else {
    const type = info.type === "media" ? "video" : info.type;
    if (isDirect(info)) {
      return {
        type,
        sources: [{ src: getLink(info).href }],
      };
    } else if (isInternal(info)) {
      if (info.subtitles.length > 0 && info.trackInfo === undefined)
        throw new Error("trackInfo not updated");
      else
        return {
          type,
          sources: [{ src: getLink(info, vault).href }],
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
