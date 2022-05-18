import { PayloadAction } from "@reduxjs/toolkit";

import { resetActions } from "./controlled/reset";
import { createSlice } from "./utils";

export const enum Controls {
  native = 1,
  custom,
  none,
}

type Track = Pick<TextTrack, "kind" | "label" | "language">;

export interface InterfaceState {
  controls: Controls;
  fullscreen: boolean;
  /**
   * string: "16/9"
   * 0: no ratio (e.g. audio)
   * null: ratio not available
   */
  ratio: string | 0 | null;
  activeCues: string | null;
  textTracks: {
    list: Track[];
    active: number;
    enabled: boolean;
  };
  ignoreEvent: {
    tracks: boolean;
  };
  filter: boolean;
}

const initialState: InterfaceState = {
  controls: Controls.custom,
  fullscreen: false,
  ratio: null,
  activeCues: null,
  textTracks: { list: [], active: -1, enabled: true },
  ignoreEvent: { tracks: false },
  filter: false,
};

const slice = createSlice({
  name: "interface",
  initialState,
  getState: (s) => s.interface,
  setState: (r, s) => ((r.interface = s), void 0),
  reducers: {
    handleFullscreenChange: (state, action: PayloadAction<boolean>) => {
      state.fullscreen = action.payload;
    },
    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.fullscreen = action.payload;
    },
    toggleFullscreen: (state) => {
      state.fullscreen = !state.fullscreen;
    },
    // setControls: (state, action: PayloadAction<boolean>) => {
    //   state.controls = action.payload ? initialState.controls : "none";
    // },
    setRatio: (
      state,
      action: PayloadAction<string | [width: number, height: number]>,
    ) => {
      if (Array.isArray(action.payload)) {
        const [width, height] = action.payload;
        state.ratio = `${width}/${height}`;
      } else {
        state.ratio = action.payload;
      }
    },
    resetInterface: (state) => {
      return { ...initialState, controls: state.controls };
    },
    updateCues: (state, action: PayloadAction<string[]>) => {
      if (action.payload.length === 0) {
        state.activeCues = null;
      } else {
        state.activeCues = action.payload
          .flatMap((c) => c.split(/[\r\n]+/g))
          .map((c) => c.trim())
          .filter((c) => !!c)
          .join("\n");
      }
    },
    toggleTracks: (state) => {
      const enable = !state.textTracks.enabled;
      state.textTracks.enabled = enable;
      if (!enable) state.activeCues = null;
    },
    setActiveTrack: (state, action: PayloadAction<number>) => {
      const { list } = state.textTracks,
        newActive = action.payload;
      if (newActive >= 0 && newActive < list.length) {
        state.textTracks.active = newActive;
        state.textTracks.enabled = true;
      } else {
        console.error("caption index out of range", list.length);
      }
    },
    lockTracksUpdateEvent: (state) => {
      state.ignoreEvent.tracks = true;
    },
    unlockTracksUpdateEvent: (state) => {
      state.ignoreEvent.tracks = false;
    },
    handleTrackListChange: (
      state,
      action: PayloadAction<InterfaceState["textTracks"]>,
    ) => {
      if (!state.ignoreEvent.tracks) state.textTracks = action.payload;
    },
    setFilter: (state, action: PayloadAction<boolean>) => {
      state.filter = action.payload;
    },
    toggleFilter: (state) => {
      state.filter = !state.filter;
    },
  },
  extraReducers: (builder) =>
    builder.addMatcher(
      (action) => resetActions.includes(action.type),
      () => initialState,
    ),
});
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

export default slice;
