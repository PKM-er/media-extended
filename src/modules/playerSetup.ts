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

/**
 * @param src raw linktext (may contain #hash)
 * @returns setPlayer return null when timeSpan/loop not parsed from srcLinktext
 */
export function getSetupTool(src: string): {
  linktext: string;
  setPlayer: ((player: HTMLMediaElement) => void) | null;
} {
  if (!src) throw new TypeError("srcLinktext empty");
  const { path: linktext, subpath: hash } = parseLinktext(src);
  const timeSpan = parseTF(hash);
  const isLoop = parse(hash).loop === null;

  let setPlayer: ((player: HTMLMediaElement) => void) | null;
  if (!timeSpan && !isLoop) setPlayer = null;
  else
    setPlayer = (player: HTMLMediaElement): void => {
      // null: exist, with no value (#loop)
      if (isLoop) player.loop = true;
      // import timestamps to player
      if (timeSpan) injectTimestamp(player, timeSpan);
    };

  return { linktext, setPlayer };
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
