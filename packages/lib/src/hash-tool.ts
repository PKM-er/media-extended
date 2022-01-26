import type Plyr from "plyr";
import { parse as parseQS, ParsedQuery } from "query-string";

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

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function initPlayer(this: HashTool, player: Player) {
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
  playerTF.setTimeSpan(this.timeSpan);
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
}
