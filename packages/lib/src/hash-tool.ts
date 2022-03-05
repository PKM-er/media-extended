import type Plyr from "plyr";
import { parse as parseQS, ParsedQuery } from "query-string";

import { parseTF, TimeSpan } from "./temporal-frag";

/** Player with temporal fragments */
export type Player_TF = HTMLMediaEl_TF | Plyr_TF;
export type Player = HTMLMediaElement | Plyr;

interface TemporalFrag {
  timeSpan: TimeSpan | null;
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

/**
 * if current is out of range when start playing,
 * move currentTime back to timeSpan.start
 **/
function onplay(this: Player_TF) {
  if (!this.timeSpan) return;
  const {
    timeSpan: { start, end },
    currentTime,
  } = this;
  console.log(start, end, currentTime);
  if (currentTime > end || currentTime < start) {
    console.log("yes");
    this.currentTime = start;
  }
}
/**
 * if currentTime reaches end, pause video
 * or play at start when loop is enabled
 */
async function ontimeupdate(this: Player_TF) {
  if (!this.timeSpan) return;
  const {
    timeSpan: { start, end },
    currentTime,
  } = this;
  if (currentTime > end) {
    if (!this.loop) {
      this.pause();
    } else {
      this.currentTime = start;
      // continue to play in loop
      // if temporal fragment (#t=,2 at the end of src) paused the video
      if (this.paused) await this.play();
    }
  } else if (currentTime < start) {
    this.currentTime = start;
  }
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function initPlayer(this: HashTool, player: Player) {
  const playerTF = player as Player_TF;
  if (playerTF instanceof HTMLMediaElement) {
    playerTF.addEventListener("timeupdate", ontimeupdate.bind(playerTF));
    playerTF.addEventListener("play", onplay.bind(playerTF));
  } else {
    playerTF.on("timeupdate", ontimeupdate.bind(playerTF));
    playerTF.on("play", onplay.bind(playerTF));
  }
  this.setTimeSpan(playerTF);
}

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls";
const hashOpts = new Map<string, PlayerProperties>([
  ["loop", "loop"],
  ["mute", "muted"],
  ["play", "autoplay"],
  ["controls", "controls"],
]);

export class HashTool {
  public timeSpan: TimeSpan | null;
  public hash: string | null;

  private hashQuery: ParsedQuery<string> | null;
  /**
   * provide utils to set player properties from provided hash
   */
  constructor(hash?: string) {
    if (hash) {
      this.hash = hash;
      this.hashQuery = parseQS(hash);
      this.timeSpan = parseTF(hash);
    } else {
      this.hash = null;
      this.hashQuery = null;
      this.timeSpan = null;
    }
    this.initPlayer = initPlayer.bind(this);
  }
  /**
   * @returns null: exist, with no value (#loop)
   */
  private getQuery(query: string) {
    return this.hashQuery ? this.hashQuery[query] === null : false;
  }

  /** check if certian player attribute is enabled in hash */
  public is(prop: PlayerProperties): boolean {
    if (!this.hash) return false;
    for (const [query, key] of hashOpts) {
      if (prop === key && this.getQuery(query)) return true;
    }
    return false;
  }
  /** setting up player to be ready to play media fragment */
  public initPlayer: (player: Player) => void;

  /** apply player attributes enabled in hash */
  public applyAttrs(player: Player): void {
    for (const [query, key] of hashOpts) {
      if (key === "controls") {
        if (player instanceof HTMLMediaElement && this.getQuery(query))
          player[key] = true;
      } else if (this.getQuery(query)) player[key] = true;
    }
  }

  /** when update, inject event handler to restrict play range */
  public setTimeSpan(player: Player_TF) {
    if (
      (this.timeSpan && this.timeSpan.raw !== player.timeSpan?.raw) ||
      (this.timeSpan === null && player.timeSpan !== null)
    ) {
      player.timeSpan = this.timeSpan;
      // set currentTime
      if (this.timeSpan) player.currentTime = this.timeSpan.start ?? 0;
    }
  }
}
