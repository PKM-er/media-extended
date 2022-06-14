import { PayloadAction } from "@reduxjs/toolkit";
import { Fragment } from "mx-base";
import { getFragFromHash } from "mx-base";
import { parse as parseQS } from "query-string";

import { PlayerState } from ".";
import { checkDuration, getReducer } from "./utils";

export const LARGE_CURRENT_TIME = 1e101;

export interface PlayerStatus {
  /** -1 if not explicitly specified */
  fragment: Fragment | null;
  paused: boolean;
  playbackRate: number;
  /** length = 0: no restriction */
  availableSpeeds: number[];
  volume: number;
  muted: boolean;
  autoplay: boolean;
  loop: boolean;
  /**
   * the currentTime of the provider
   * one-way binded to the currentTime of the provider
   * (provider -> store, updated via onTimeUpdate)
   * setting this value won't applied to provider
   */
  currentTime: number;
  duration: number | null;
  /**
   * indicate that provider is trying to set new currentTime
   * set to false when the new currentTime is applied
   * (loaded and can continue to play, aka seeked)
   */
  seeking: boolean;
  /**
   * buffered range in seconds
   */
  buffered: number;
  waiting: boolean;
  ended: boolean;
  hasStarted: boolean;
  error: string | null;
}

export const handleDuration = (state: PlayerState, duration: number | null) => {
  if (checkDuration(duration)) {
    state.status.duration = duration;
  } else {
    state.status.duration === null;
  }
};

const caseReducer = getReducer({
  setHash: (
    state,
    action: PayloadAction<[hash: string, fromLink?: boolean]>,
  ) => {
    const [hash, fromLink = false] = action.payload;
    const query = parseQS(hash),
      frag = getFragFromHash(hash);
    state.status.fragment = frag;
    // state.loop = is(query, "loop");
    // state.autoplay = is(query, "autoplay");
    // state.muted = is(query, "muted");

    // start playing when timestamp is seeked to
    // if (fromLink) state.paused = false;
  },
  setFragment: (state, action: PayloadAction<Fragment | null>) => {
    const frag = action.payload;
    state.status.fragment = frag;

    // start playing when timestamp is seeked to
    // if (frag && isTimestamp(frag)) state.paused = false;
  },
  handleLoopChange: (state, action: PayloadAction<boolean>) => {
    state.status.loop = action.payload;
  },
  handleAutoplayChange: (state, action: PayloadAction<boolean>) => {
    state.status.autoplay = action.payload;
  },
  handleVolumeChange: (
    state,
    action: PayloadAction<{ volume: number; muted: boolean }>,
  ) => {
    // setVolumeTo(action.payload.volume, state);
    state.status.muted = action.payload.muted;
  },
  handlePlaying: (state) => {
    state.status.paused = false;
    state.status.ended = false;
    state.status.waiting = false;
    state.status.hasStarted = true;
  },
  handlePause: (state) => {
    state.status.paused = true;
  },
  handleRateChange: (state, action: PayloadAction<number>) => {
    state.status.playbackRate = action.payload;
  },
  handleTimeUpdate: (state, action: PayloadAction<number>) => {
    if (action.payload !== LARGE_CURRENT_TIME)
      state.status.currentTime = action.payload;
    if (state.status.duration === action.payload) {
      state.status.ended = true;
    }
  },
  handleDurationChange: (state, action: PayloadAction<number | null>) =>
    handleDuration(state, action.payload),
  handleSeeking: (state) => {
    state.status.seeking = true;
  },
  handleSeeked: (state) => {
    state.status.seeking = false;
  },
  handleProgress: (
    state,
    action: PayloadAction<{ buffered: number; duration: number }>,
  ) => {
    const { buffered, duration } = action.payload;
    if (buffered >= 0) {
      state.status.buffered = buffered;
    } else {
      console.error("invaild buffered value", action.payload);
    }
    if (checkDuration(duration)) {
      state.status.duration = duration;
    }
  },
  handleEnded: (state) => {
    state.status.ended = true;
  },
  handleWaiting: (state) => {
    state.status.waiting = true;
  },
  handleError: (
    state,
    action: PayloadAction<{ message: string; code?: number }>,
  ) => {
    state.status.error = `${action.payload.message} (${action.payload.code})`;
  },
  updateBasicInfo: (
    state,
    action: PayloadAction<{
      seeking: boolean;
      duration: number;
      buffered: number | null;
    }>,
  ) => {
    const { buffered, duration, seeking } = action.payload;
    if (buffered && buffered >= 0) {
      state.status.buffered = buffered;
    } else if (buffered !== null) {
      console.error("invaild buffered value", action.payload);
    }
    if (checkDuration(duration)) {
      state.status.duration = duration;
    }
    state.status.seeking = seeking;
  },
  revertDuration: (state, action: PayloadAction<number>) => {
    state.status.duration = action.payload;
  },
});

export default caseReducer;
