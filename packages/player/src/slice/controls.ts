import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AppThunk } from "../app/store";
import { setVolumeByOffest as setVolumeByOffestYtb } from "./youtube";

export const LARGE_CURRENT_TIME = 1e101;

export interface ControlsState {
  /**
   * the currentTime of the provider
   * one-way binded to the currentTime of the provider
   * (provider -> store, updated via onTimeUpdate)
   * setting this value won't applied to provider */
  currentTime: number;
  paused: boolean;
  fullscreen: boolean;
  fragment: null | [number, number];
  playbackRate: number;
  volume: number;
  muted: boolean;
  autoplay: boolean;
  duration: number | null;
  /**
   * indicate that provider is trying to set new currentTime
   * set to false when the new currentTime is applied
   * (loaded and can continue to play, aka seeked)
   */
  seeking: boolean;
  /**
   * indicate that user is using the progress bar to seek new currentTime,
   * one-way binding to the currentTime of the provider
   * (store -> provider)
   * changing back to null means user seek end and binding is revoked
   */
  userSeek: { currentTime: number; pausedBeforeSeek: boolean | null } | null;
  loop: boolean;
  /**
   * buffered range in seconds
   */
  buffered: number;
  waiting: boolean;
  ended: boolean;
  hasStarted: boolean;
  activeTextTrack: null;
  error: string | null;
}
const initialState: ControlsState = {
  currentTime: 0,
  paused: true,
  fullscreen: false,
  fragment: null,
  playbackRate: 1,
  volume: 0.8,
  muted: false,
  autoplay: false,
  seeking: false,
  duration: null,
  userSeek: null,
  loop: false,
  buffered: 0,
  waiting: false,
  ended: false,
  hasStarted: false,
  activeTextTrack: null,
  error: null,
};

export const controlsSlice = createSlice({
  name: "controls",
  initialState,
  reducers: {
    setFragment: (
      state,
      action: PayloadAction<null | Partial<Record<"start" | "end", number>>>,
    ) => {
      if (!action.payload || (!action.payload.start && !action.payload.end)) {
        state.fragment = null;
      } else {
        const { start, end } = action.payload;
        state.fragment = [start ?? 0, end ? end : Infinity];
      }
    },
    reset: (state) => {
      Object.assign(state, initialState);
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

    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.fullscreen = action.payload;
    },

    toggleFullscreen: (state) => {
      state.fullscreen = !state.fullscreen;
    },
    setPlaybackRate: (state, action: PayloadAction<number>) => {
      if (action.payload > 0) {
        state.playbackRate = action.payload;
      } else {
        state.playbackRate = 1;
      }
    },
    setMute: (state, action: PayloadAction<boolean>) => {
      state.muted = action.payload;
    },
    toggleMute: (state) => {
      state.muted = !state.muted;
    },
    setAutoPlay: (state, action: PayloadAction<boolean>) => {
      state.autoplay = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      setVolumeTo(action.payload, state);
    },
    setVolumeByOffest: (state, action: PayloadAction<number>) => {
      setVolumeTo(state.volume + action.payload / 100, state);
    },
    userSeekStart: (
      state,
      action: PayloadAction<number | [time: number, noPause: boolean]>,
    ) => {
      let time: number, noPause: boolean;
      if (typeof action.payload === "number") {
        time = action.payload;
        noPause = false;
      } else {
        [time, noPause] = action.payload;
      }
      state.userSeek = {
        currentTime: time,
        pausedBeforeSeek: noPause ? null : state.paused,
      };
      noPause || (state.paused = true);
    },
    userSeeking: (state, action: PayloadAction<number>) => {
      if (state.userSeek) {
        state.userSeek.currentTime = action.payload;
      }
    },
    userSeekEnd: (state) => {
      if (state.userSeek) {
        state.userSeek.pausedBeforeSeek !== null &&
          (state.paused = state.userSeek.pausedBeforeSeek);
        state.userSeek = null;
      }
    },
    updateSeeking: (state, action: PayloadAction<boolean>) => {
      state.seeking = action.payload;
    },
    handleTimeUpdate: (state, action: PayloadAction<number>) => {
      if (action.payload !== LARGE_CURRENT_TIME)
        state.currentTime = action.payload;
      if (state.duration === action.payload) {
        state.ended = true;
      }
    },
    handleFullscreenChange: (state, action: PayloadAction<boolean>) => {
      state.fullscreen = action.payload;
    },
    handleVolumeChange: (
      state,
      action: PayloadAction<{ volume: number; muted: boolean }>,
    ) => {
      setVolumeTo(action.payload.volume, state);
      state.muted = action.payload.muted;
    },
    handleDurationChange: (state, action: PayloadAction<number | null>) => {
      state.duration = action.payload;
    },
    handleSeeking: (state) => {
      state.seeking = true;
    },
    handleSeeked: (state) => {
      state.seeking = false;
    },
    handlePlaying: (state) => {
      state.paused = false;
      state.ended = false;
      state.waiting = false;
      state.hasStarted = true;
    },
    handlePause: (state) => {
      state.paused = true;
    },
    handleRateChange: (state, action: PayloadAction<number>) => {
      state.playbackRate = action.payload;
    },
    handleProgress: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0) {
        state.buffered = action.payload;
      } else {
        console.error("invaild buffered value", action.payload);
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
  },
});

export const {
  setFragment,
  reset,
  play,
  pause,
  togglePlay,
  setFullscreen,
  toggleFullscreen,
  setMute,
  toggleMute,
  setAutoPlay,
  setVolume,
  userSeeking,
  userSeekStart,
  userSeekEnd,
  updateSeeking,
} = controlsSlice.actions;

const trunc = (number: number) => Math.trunc(number * 20) / 20;
export const setPlaybackRate =
  (rate: number): AppThunk =>
  (dispatch, getState) => {
    const { provider, youtube } = getState();
    if (provider.from === "youtube") {
      const speeds = youtube.availableSpeeds;
      const max = speeds.length === 1 ? 2 : speeds[speeds.length - 1],
        min = speeds.length === 1 ? 0.25 : speeds[0];
      if (rate <= max && rate >= min) {
        dispatch(controlsSlice.actions.setPlaybackRate(trunc(rate)));
      }
    } else {
      dispatch(controlsSlice.actions.setPlaybackRate(rate));
    }
  };
export const setVolumeByOffest =
  (percent: number): AppThunk =>
  (dispatch, getState) => {
    const { provider } = getState();
    if (provider.from === "youtube") {
      dispatch(setVolumeByOffestYtb(percent));
    } else dispatch(controlsSlice.actions.setVolumeByOffest(percent));
  };

export const {
  handleTimeUpdate,
  handleFullscreenChange,
  handleVolumeChange,
  handleDurationChange,
  handleSeeking,
  handleSeeked,
  handlePlaying,
  handlePause,
  handleRateChange,
  handleProgress,
  handleEnded,
  handleWaiting,
  handleError,
} = controlsSlice.actions;

export default controlsSlice.reducer;

export const seekTo =
  (currentTime: number): AppThunk =>
  async (dispatch) => {
    dispatch(userSeekStart([currentTime, true]));
    await wait(0);
    dispatch(userSeekEnd());
  };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setVolumeTo = (newVolume: number, state: ControlsState) => {
  if (newVolume < 0) {
    state.volume = 0;
  } else if (newVolume > 1) {
    state.volume = 1;
  } else {
    state.volume = newVolume;
  }
};
