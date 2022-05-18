import type { Fragment } from "@base/hash-tool";
import { getFragFromHash, is } from "@base/hash-tool";
import { createAction, PayloadAction } from "@reduxjs/toolkit";
import { isTimestamp } from "mx-lib";
import { parse as parseQS } from "query-string";

import { setVolumeTo } from "../common";
import { createSlice } from "../utils";
import { resetActions } from "./reset";

export interface ControlledState {
  /** -1 if not explicitly specified */
  fragment: Fragment | null;
  paused: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  autoplay: boolean;
  loop: boolean;
  /** set to prevent event from updating state */
  ignoreEvent: {
    playpause: boolean;
  };
}

const initialState: ControlledState = {
  fragment: null,
  paused: true,
  playbackRate: 1,
  volume: 0.8,
  muted: false,
  autoplay: false,
  loop: false,
  ignoreEvent: {
    playpause: false,
  },
};

const slice = createSlice({
  name: "controlled",
  initialState,
  getState: (s) => s.controlled,
  setState: (r, s) => ((r.controlled = s), void 0),
  reducers: {
    handleLoopChange: (state, action: PayloadAction<boolean>) => {
      state.loop = action.payload;
    },
    handleAutoplayChange: (state, action: PayloadAction<boolean>) => {
      state.autoplay = action.payload;
    },
    handleVolumeChange: (
      state,
      action: PayloadAction<{ volume: number; muted: boolean }>,
    ) => {
      setVolumeTo(action.payload.volume, state);
      state.muted = action.payload.muted;
    },
    handlePlaying: (state) => {
      if (state.ignoreEvent.playpause) return;
      state.paused = false;
    },
    handlePause: (state) => {
      if (state.ignoreEvent.playpause) return;
      state.paused = true;
    },
    handleRateChange: (state, action: PayloadAction<number>) => {
      state.playbackRate = action.payload;
    },
    lockPlayPauseEvent: (state) => {
      state.ignoreEvent.playpause = true;
    },
    unlockPlayPauseEvent: (state) => {
      state.ignoreEvent.playpause = false;
    },
    setHash: (
      state,
      action: PayloadAction<[hash: string, fromLink?: boolean]>,
    ) => {
      const [hash, fromLink = false] = action.payload;
      const query = parseQS(hash),
        frag = getFragFromHash(hash);
      state.fragment = frag;
      state.loop = is(query, "loop");
      state.autoplay = is(query, "autoplay");
      state.muted = is(query, "muted");

      // start playing when timestamp is seeked to
      if (fromLink) state.paused = false;
    },
    setFragment: (state, action: PayloadAction<Fragment | null>) => {
      const frag = action.payload;
      state.fragment = frag;

      // start playing when timestamp is seeked to
      if (frag && isTimestamp(frag)) state.paused = false;
    },
    play: (state) => {
      state.paused = false;
    },
    pause: (state) => {
      state.paused = true;
    },
    togglePlay: (state) => {
      state.paused = !state.paused;
    },
    setMute: (state, action: PayloadAction<boolean>) => {
      state.muted = action.payload;
    },
    toggleMute: (state) => {
      state.muted = !state.muted;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      setVolumeTo(action.payload, state);
    },
    setVolumeUnmute: (state, action: PayloadAction<number>) => {
      setVolumeTo(action.payload, state);
      state.muted = false;
    },
  },
  extraReducers: (builder) =>
    builder.addMatcher(
      (action) => resetActions.includes(action.type),
      () => initialState,
    ),
});
export const {
  handlePlaying,
  setHash,
  setFragment,
  handleAutoplayChange,
  handleLoopChange,
  handlePause,
  handleRateChange,
  handleVolumeChange,
  lockPlayPauseEvent,
  pause,
  play,
  setMute,
  setVolume,
  setVolumeUnmute,
  toggleMute,
  togglePlay,
  unlockPlayPauseEvent,
} = slice.actions;

export const setPlaybackRate = createAction<number>(
    slice.name + "/setPlaybackRate",
  ),
  setVolumeByOffest = createAction<number>(slice.name + "/setVolumeByOffest");

export default slice;
