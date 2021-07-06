import { parseTF, TimeSpan } from "./temporal-frag";
import { parse } from "query-string";
import Plyr from "plyr";
import {
  Host,
  isDirect,
  isHost,
  isInternal,
  videoInfo,
  videoInfo_Host,
} from "./video-info";
import assertNever from "assert-never";

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

export function isHTMLMediaEl_TF(el: HTMLMediaElement): el is HTMLMediaEl_TF {
  return (
    Boolean((el as HTMLMediaEl_TF).timeSpan) ||
    (el as HTMLMediaEl_TF).timeSpan === null
  );
}

const defaultPlyrControls = [
  "play-large", // The large play button in the center
  // "restart", // Restart playback
  // "rewind", // Rewind by the seek time (default 10 seconds)
  "play", // Play/pause playback
  // "fast-forward", // Fast forward by the seek time (default 10 seconds)
  "progress", // The progress bar and scrubber for playback and buffering
  "current-time", // The current time of playback
  "duration", // The full duration of the media
  // "mute", // Toggle mute
  "volume", // Volume control
  "captions", // Toggle captions
  "settings", // Settings menu
  // "pip", // Picture-in-picture (currently Safari only)
  // "airplay", // Airplay (currently Safari only)
  // "download", // Show a download button with a link to either the current source or a custom URL you specify in your options
  "fullscreen", // Toggle fullscreen
];

const defaultPlyrOption: Plyr.Options = {
  // fullscreen: { enabled: false },
  invertTime: false,
  controls: defaultPlyrControls,
};

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay";

type setupTool = {
  timeSpan: TimeSpan | null;
  is: (prop: PlayerProperties) => boolean;
  setHashOpt: (player: Player) => void;
  setPlayerTF: (player: Player) => void;
};

export function getSetupTool(hash: string | null): setupTool {
  const timeSpan = hash ? parseTF(hash) : null;
  const hashQuery = hash ? parse(hash) : null;
  const getQuery = (query: string) =>
    hashQuery ? hashQuery[query] === null : false;
  // null: exist, with no value (#loop)

  const hashOpts = new Map<string, PlayerProperties>([
    ["loop", "loop"],
    ["mute", "muted"],
    ["play", "autoplay"],
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
        if (getQuery(query)) player[key] = true;
      }),
  };
}

export function PlayerTFSetup(player: Player, timeSpan?: TimeSpan | null) {
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
}

export function setRatio(containerEl: HTMLDivElement, player: Plyr) {
  player.once("ready", function () {
    let trys = 0;

    const id = setInterval(() => {
      if (player.ratio) {
        // @ts-ignore
        containerEl.style.aspectRatio = player.ratio.replace(/:/, "/");
        clearInterval(id);
      } else if (trys >= 10) {
        console.error("failed to get player.ratio");
        clearInterval(id);
      } else trys++;
    }, 100);
  });
}

export function getPlyrForHost(
  info: videoInfo_Host,
  useYtControls = false,
): ReturnType<typeof getPlyr> {
  const { timeSpan } = getSetupTool(info.hash);

  let options: Plyr.Options;
  if (info.host === Host.youtube) {
    options = {};
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
  } else options = {};

  const result = getPlyr(info, options);
  const { container, player } = result;
  if (useYtControls) container.classList.add("yt-controls");
  if (info.host === Host.youtube && useYtControls) {
    player.on("ready", (event) => {
      player.play();
      player.pause();
    });
  }
  return result;
}

export function getPlyr(
  info: videoInfo,
  options?: Plyr.Options,
): { container: HTMLDivElement; player: Plyr_TF } {
  const { is, setHashOpt, setPlayerTF } = getSetupTool(info.hash);

  const container = createDiv();
  const playerEl = container.appendChild(createEl("video"));

  if (options) options = { ...defaultPlyrOption, ...options };
  else options = defaultPlyrOption;

  options.autoplay = is("autoplay");
  const player = new Plyr(playerEl, options);
  let source = infoToSource(info);

  player.source = source;
  (player as Plyr_TF).sourceBak = source;

  setHashOpt(player);
  setPlayerTF(player);
  if (isInternal(info) && info.trackInfo) {
    // hide poster to make subtitle selectable
    playerEl.querySelector("div.plyr__poster")?.addClass("visuallyhidden");
    player.once("ready", () => player.toggleCaptions());
  }

  checkMediaType(info, player);

  return { container, player: player as Plyr_TF };
}

/** check media type that can not be determined by extension and switch source accordingly */
export const checkMediaType = (info: videoInfo, player: Plyr) => {
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
            player.source = (player as Plyr_TF).sourceBak;
          } else {
            (player as Plyr_TF).sourceBak.type = "video";
          }
        }
      }
    };
    player.on("loadedmetadata", handler);
  }
};

export const infoToSource = (info: videoInfo): Plyr.SourceInfo => {
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
    const sources = [{ src: info.link.href }];
    if (isDirect(info)) {
      return {
        type,
        sources,
      };
    } else if (isInternal(info)) {
      return {
        type,
        sources,
        tracks: info.trackInfo ? info.trackInfo.tracks : undefined,
      };
    } else {
      assertNever(info);
    }
  }
};
