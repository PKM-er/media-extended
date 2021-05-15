import { parseTF, TimeSpan } from "./tfTools";
import { stringify, parse } from "query-string";
import { parseLinktext } from "obsidian";

export interface Plyr_TF extends Plyr {
  timeSpan: TimeSpan | null;
}

export type Player_TF = HTMLMediaEl_TF | Plyr_TF;
export type Player = HTMLMediaElement | Plyr;
export interface HTMLMediaEl_TF extends HTMLMediaElement {
  timeSpan: TimeSpan;
}
export function isHTMLMediaEl_TF(el: HTMLMediaElement): el is HTMLMediaEl_TF {
  return (el as HTMLMediaEl_TF).timeSpan !== undefined;
}

export const defaultPlyrControls = [
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

export const defaultPlyrOption = {
  fullscreen: { enabled: false },
  invertTime: false,
  controls: defaultPlyrControls,
};

type setupTool = {
  linktext: string;
  timeSpan: TimeSpan | null;
  isLoop: boolean;
  setPlayerTF: ((player: Player) => void) | null;
};

/**
 * @param src raw linktext (may contain #hash)
 * @returns setPlayerTF return null when timeSpan&loop not parsed from srcLinktext
 */
export function getSetupTool(src: string | URL): setupTool {
  if (!src) throw new TypeError("srcLinktext empty");

  let linktext: string, hash: string;
  if (typeof src === "string") {
    const { path, subpath } = parseLinktext(src);
    linktext = path;
    hash = subpath;
  } else {
    hash = src.hash;
    linktext = src.href.slice(0, -hash.length);
  }

  const timeSpan = parseTF(hash);
  const isLoop = parse(hash).loop === null;

  let setPlayerTF: ((player: Player) => void) | null;
  if (!timeSpan && !isLoop) setPlayerTF = null;
  else
    setPlayerTF = (player: Player): void => {
      // null: exist, with no value (#loop)
      if (isLoop) player.loop = true;
      // import timestamps to player
      if (timeSpan) injectTimestamp(player, timeSpan);
    };

  return { linktext, timeSpan, isLoop, setPlayerTF };
}

/**
 * inject media fragment into player's src
 * @param player an <audio> or <video> element
 */
export function setStartTime(player: HTMLMediaEl_TF): void;
export function setStartTime(
  player: HTMLMediaElement,
  timeSpan: TimeSpan,
): void;
export function setStartTime(
  player: HTMLMediaElement,
  timeSpan?: TimeSpan,
): void {
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

export function setRatio(containerEl: HTMLDivElement, player: Plyr) {
  player.once("ready", function () {
    let trys = 0;

    const id = setInterval(() => {
      if (player.ratio) {
        console.log("got it: ", player.ratio);
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
