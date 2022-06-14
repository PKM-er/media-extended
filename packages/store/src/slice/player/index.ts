import { Controls, InterfaceState } from "./interface";
import type { MediaMeta } from "./meta/types";
import { PlayerSource } from "./source/types";
import type { PlayerStatus } from "./status";
import type { UserSeek } from "./user-seek";

export interface PlayerState {
  /**
   * status of current player,
   * obtained via event,
   * cannot be set directly
   */
  status: PlayerStatus;
  /**
   * indicate that user is using the progress bar to seek new currentTime,
   * one-way binding to the currentTime of the provider
   * (store -> provider)
   * changing back to null means user seek end and binding is revoked
   */
  userSeek: UserSeek | null;
  /**
   * player source details: urls, ids, etc.
   */
  source: PlayerSource;
  /**
   * metadata about the current media
   */
  meta: MediaMeta;
  /** player UI state */
  interface: InterfaceState;
  /** used to request async actions */
  action: ActionState;
}

const initialState: PlayerState = {
  status: {
    fragment: null,
    paused: true,
    playbackRate: 1.5,
    availableSpeeds: [],
    volume: 0.8,
    muted: false,
    autoplay: false,
    loop: false,
    currentTime: 0,
    seeking: false,
    duration: null,
    buffered: 0,
    waiting: false,
    ended: false,
    hasStarted: false,
    error: null,
  },
  userSeek: null,
  meta: {
    provider: null,
  },
  source: {
    type: null,
    src: null,
  },
  interface: {
    controls: Controls.custom,
    fullscreen: false,
    ratio: null,
    activeCues: null,
    textTracks: { list: [], active: -1, enabled: true },
    ignoreEvent: { tracks: false },
    filter: false,
  },
  action: {
    getScreenshot: null,
    getTimestamp: false,
  },
};

import { createSlice } from "@reduxjs/toolkit";

import { ActionState } from "./action";
import actionReducers from "./action";
import interfaceReducers from "./interface";
import metaReducers from "./meta";
import sourceReducers, { resetActions } from "./source";
import statusReducers from "./status";
import userSeekReducers from "./user-seek";

const slice = createSlice({
  initialState,
  name: "player",
  reducers: {
    ...sourceReducers.caseReducers,
    ...statusReducers,
    ...userSeekReducers,
    ...interfaceReducers,
    ...actionReducers.caseReducer,
    resetInterface: (state) => {
      state.interface = {
        ...initialState.interface,
        controls: state.interface.controls,
      };
    },
  },
  extraReducers: (builder) => {
    sourceReducers.extraReducer(builder);
    metaReducers.extraReducer(builder);
    actionReducers.extraReducer(builder);
    builder.addMatcher(
      (action) => resetActions.includes(action.type),
      (state) => {
        state.interface = initialState.interface;
        state.status = initialState.status;
      },
    );
  },
});

export default slice.reducer;

export {
  disableCORS,
  renameObsidianMedia,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
  switchToAudio,
  unknownTypeDetermined,
} from "./source";
export const {
  handlePlaying,
  handleAutoplayChange,
  handleLoopChange,
  handlePause,
  handleRateChange,
  handleVolumeChange,
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
export const {
  /* setControls, */
  setRatio,
  resetInterface,
  updateCues,
  handleTrackListChange,
  lockTracksUpdateEvent,
  setActiveTrack,
  toggleTracks,
  unlockTracksUpdateEvent,
  setFilter,
  toggleFilter,
  toggleFullscreen,
  handleFullscreenChange,
  setFullscreen,
} = slice.actions;
export const {
  dragSeek,
  dragSeekEnd,
  keyboardSeek,
  keyboardSeekEnd,
  manualSeekDone,
  progressBarSeek,
  progressBarSeekEnd,
  requestManualOffsetSeek,
  requestManualSeek,
} = slice.actions;
export const {
  gotScreenshot,
  gotTimestamp,
  cancelScreenshot,
  cancelTimestamp,
  requestTimestamp,
  requsetScreenshot,
} = slice.actions;
export * from "./control-actions";
