import { PayloadAction } from "@reduxjs/toolkit";

import { getReducer } from "./utils";

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

const caseReducer = getReducer({
  handleFullscreenChange: (state, action: PayloadAction<boolean>) => {
    state.interface.fullscreen = action.payload;
  },
  setFullscreen: (state, action: PayloadAction<boolean>) => {
    state.interface.fullscreen = action.payload;
  },
  toggleFullscreen: (state) => {
    state.interface.fullscreen = !state.interface.fullscreen;
  },
  // setControls: (state, action: PayloadAction<boolean>) => {
  //   state.interface.controls = action.payload ? initialstate.interface.controls : "none";
  // },
  setRatio: (
    state,
    action: PayloadAction<string | [width: number, height: number]>,
  ) => {
    if (Array.isArray(action.payload)) {
      const [width, height] = action.payload;
      state.interface.ratio = `${width}/${height}`;
    } else {
      state.interface.ratio = action.payload;
    }
  },
  updateCues: (state, action: PayloadAction<string[]>) => {
    if (action.payload.length === 0) {
      state.interface.activeCues = null;
    } else {
      state.interface.activeCues = action.payload
        .flatMap((c) => c.split(/[\r\n]+/g))
        .map((c) => c.trim())
        .filter((c) => !!c)
        .join("\n");
    }
  },
  toggleTracks: (state) => {
    const enable = !state.interface.textTracks.enabled;
    state.interface.textTracks.enabled = enable;
    if (!enable) state.interface.activeCues = null;
  },
  setActiveTrack: (state, action: PayloadAction<number>) => {
    const { list } = state.interface.textTracks,
      newActive = action.payload;
    if (newActive >= 0 && newActive < list.length) {
      state.interface.textTracks.active = newActive;
      state.interface.textTracks.enabled = true;
    } else {
      console.error("caption index out of range", list.length);
    }
  },
  lockTracksUpdateEvent: (state) => {
    state.interface.ignoreEvent.tracks = true;
  },
  unlockTracksUpdateEvent: (state) => {
    state.interface.ignoreEvent.tracks = false;
  },
  handleTrackListChange: (
    state,
    action: PayloadAction<InterfaceState["textTracks"]>,
  ) => {
    if (!state.interface.ignoreEvent.tracks)
      state.interface.textTracks = action.payload;
  },
  setFilter: (state, action: PayloadAction<boolean>) => {
    state.interface.filter = action.payload;
  },
  toggleFilter: (state) => {
    state.interface.filter = !state.interface.filter;
  },
});

export default caseReducer;
