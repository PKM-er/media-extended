import { PayloadAction } from "@reduxjs/toolkit";

import { checkDuration } from "../common";
import { createSlice } from "../utils";

export const LARGE_CURRENT_TIME = 1e101;

export interface PlayerStatus {
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

const initialState: PlayerStatus = {
  currentTime: 0,
  seeking: false,
  duration: null,
  buffered: 0,
  waiting: false,
  ended: false,
  hasStarted: false,
  error: null,
};

export const handleDuration = (
  state: PlayerStatus,
  duration: number | null,
) => {
  if (checkDuration(duration)) {
    state.duration = duration;
  } else {
    state.duration === null;
  }
};

import { Fragment, getFragFromHash } from "mx-base";
import { isTimestamp } from "mx-lib";

const applyTimeFragment = (state: PlayerStatus, frag: Fragment | null) => {
  if (frag && isTimestamp(frag)) {
    state.currentTime = frag[0];
  }
};

import { handlePlaying, setFragment, setHash } from "../controlled";
import { resetActions } from "../controlled/reset";
import { handlePlayerReady } from "../youtube";

const slice = createSlice({
  name: "status",
  initialState,
  getState: (s) => s.status,
  setState: (r, s) => ((r.status = s), void 0),
  extraReducers: (build) =>
    build
      .addCase(handlePlaying, (state) => {
        state.ended = false;
        state.waiting = false;
        state.hasStarted = true;
      })
      .addCase(setHash, (state, action) =>
        applyTimeFragment(state, getFragFromHash(action.payload[0])),
      )
      .addCase(setFragment, (state, action) =>
        applyTimeFragment(state, action.payload),
      )
      .addCase(handlePlayerReady, (state, action) =>
        handleDuration(state, action.payload.duration),
      )
      .addMatcher(
        (action) => resetActions.includes(action.type),
        () => initialState,
      ),
  reducers: {
    handleTimeUpdate: (state, action: PayloadAction<number>) => {
      if (action.payload !== LARGE_CURRENT_TIME)
        state.currentTime = action.payload;
      if (state.duration === action.payload) {
        state.ended = true;
      }
    },
    handleDurationChange: (state, action: PayloadAction<number | null>) =>
      handleDuration(state, action.payload),
    handleSeeking: (state) => {
      state.seeking = true;
    },
    handleSeeked: (state) => {
      state.seeking = false;
    },
    handleProgress: (
      state,
      action: PayloadAction<{ buffered: number; duration: number }>,
    ) => {
      const { buffered, duration } = action.payload;
      if (buffered >= 0) {
        state.buffered = buffered;
      } else {
        console.error("invaild buffered value", action.payload);
      }
      if (checkDuration(duration)) {
        state.duration = duration;
      }
    },
    handleEnded: (state) => {
      state.ended = true;
    },
    handleWaiting: (state) => {
      state.waiting = true;
    },
    handleError: (
      state,
      action: PayloadAction<{ message: string; code?: number }>,
    ) => {
      state.error = `${action.payload.message} (${action.payload.code})`;
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
        state.buffered = buffered;
      } else if (buffered !== null) {
        console.error("invaild buffered value", action.payload);
      }
      if (checkDuration(duration)) {
        state.duration = duration;
      }
      state.seeking = seeking;
    },
    revertDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
  },
});

export const {
  handleDurationChange,
  handleEnded,
  handleError,
  handleProgress,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleWaiting,
  revertDuration,
  updateBasicInfo,
} = slice.actions;
export default slice;
