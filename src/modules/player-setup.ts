import { parseTF, TimeSpan } from "./temporal-frag";
import { stringify, parse } from "query-string";
import { parseLinktext } from "obsidian";
import Plyr from "plyr";

/** Player with temporal fragments */
export type Player_TF = HTMLMediaEl_TF | Plyr_TF;
export type Player = HTMLMediaElement | Plyr;

/** Plyr with temporal fragments */
export interface Plyr_TF extends Plyr {
  timeSpan: TimeSpan | null;
}
/** HTMLMediaElement with temporal fragments */
export interface HTMLMediaEl_TF extends HTMLMediaElement {
  timeSpan: TimeSpan;
}
export function isHTMLMediaEl_TF(el: HTMLMediaElement): el is HTMLMediaEl_TF {
  return (el as HTMLMediaEl_TF).timeSpan !== undefined;
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
  // "fullscreen", // Toggle fullscreen
];

const defaultPlyrOption = {
  fullscreen: { enabled: false },
  invertTime: false,
  controls: defaultPlyrControls,
};

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay";

export type setupTool = {
  timeSpan: TimeSpan | null;
  is: (prop: PlayerProperties) => boolean;
  setHashOpt: (player: Player) => void;
  setPlayerTF: (player: Player) => void;
};

export function getSetupTool(hash: string): setupTool {
  const timeSpan = parseTF(hash);
  const hashQuery = parse(hash);
  // null: exist, with no value (#loop)

  const hashOpts = new Map<string, PlayerProperties>([
    ["loop", "loop"],
    ["mute", "muted"],
    ["play", "autoplay"],
  ]);

  return {
    timeSpan,
    is: (prop) => {
      for (const [hash, key] of hashOpts) {
        if (prop === key && hashQuery[hash] === null) return true;
      }
      return false;
    },
    setPlayerTF: (player) => {
      if (timeSpan) injectTimestamp(player, timeSpan);
    },
    setHashOpt: (player) =>
      hashOpts.forEach((key, hash) => {
        if (hashQuery[hash] === null) player[key] = true;
      }),
  };
}

/**
 * inject media fragment into player's src
 * @param player an <audio> or <video> element
 */
function setStartTime(player: HTMLMediaEl_TF): void;
function setStartTime(player: HTMLMediaElement, timeSpan: TimeSpan): void;
function setStartTime(player: HTMLMediaElement, timeSpan?: TimeSpan): void {
  if (isHTMLMediaEl_TF(player)) {
    timeSpan = player.timeSpan;
  }
  if (!timeSpan) throw new Error("timespan not found");

  const { path, subpath: hash } = parseLinktext(player.src);
  let hashObj = parse(hash);
  hashObj.t = timeSpan.raw;
  player.src = path + "#" + stringify(hashObj);
}

export function injectTimestamp(player: Player, timeSpan: TimeSpan): Player_TF {
  const playerTF = player as Player_TF;
  playerTF.timeSpan = timeSpan;

  if (playerTF instanceof HTMLMediaElement) {
    setStartTime(playerTF, timeSpan);
  }

  // inject event handler to restrict play range
  /**
   * if current is out of range when start playing,
   * move currentTime back to timeSpan.start
   **/
  const onplaying = (e: Event) => {
    if (!playerTF.timeSpan) throw new Error("timeSpan not found");

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
    if (!playerTF.timeSpan) throw new Error("timeSpan not found");

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
  if (playerTF instanceof HTMLMediaElement) {
    playerTF.onplaying = onplaying;
    playerTF.ontimeupdate = ontimeupdate;
  } else {
    playerTF.on("playing", onplaying);
    playerTF.on("timeupdate", ontimeupdate);
  }

  return playerTF;
}

function setRatio(containerEl: HTMLDivElement, player: Plyr) {
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

export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLIFrameElement,
  tool: setupTool,
  options?: Plyr.Options,
): Plyr_TF;
export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLMediaElement,
  tool: setupTool,
  options?: Plyr.Options,
  tracks?: HTMLTrackElement[],
): Plyr_TF;
export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLIFrameElement | HTMLMediaElement,
  tool: setupTool,
  options?: Plyr.Options,
  tracks?: HTMLTrackElement[],
): Plyr_TF {
  const { is, setHashOpt, setPlayerTF } = tool;

  if (
    !(
      inputEl instanceof HTMLMediaElement && container.hasClass("local-media")
    ) &&
    !(
      inputEl instanceof HTMLIFrameElement &&
      container.hasClass("external-video")
    )
  )
    throw new TypeError("inputEl and container not match");

  let plyrTargetEl: HTMLDivElement | HTMLMediaElement;
  if (inputEl instanceof HTMLMediaElement) {
    if (tracks) tracks.forEach((t) => inputEl.appendChild(t));
    plyrTargetEl = inputEl;
  } else {
    plyrTargetEl = createDiv({ cls: "plyr__video-embed" });
    plyrTargetEl.appendChild(inputEl);
  }

  container.appendChild(plyrTargetEl);

  if (options) options = { ...defaultPlyrOption, ...options };
  else options = defaultPlyrOption;

  options.autoplay = is("autoplay");
  const player = new Plyr(plyrTargetEl, options);

  // hide poster to make subtitle selectable
  if (tracks)
    container.querySelector("div.plyr__poster")?.addClass("visuallyhidden");

  setRatio(container, player);
  setHashOpt(player);
  setPlayerTF(player);

  return player as Plyr_TF;
}
