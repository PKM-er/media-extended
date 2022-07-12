import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "../../create-slice";

export const enum Controls {
  native = 1,
  custom,
  none,
}

type Track = Pick<TextTrack, "kind" | "label" | "language">;

export const initialInterface: InterfaceState = {
  controls: Controls.custom,
  fullscreen: false,
  ratio: null,
  activeCues: null,
  textTracks: { list: [], active: -1, enabled: true },
  filter: false,
};

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
  filter: boolean;
}

const { actions, reducer } = createSlice({
  name: "interface",
  state: {} as InterfaceState,
  reducers: {
    handleFullscreenChange: (_interface, action: PayloadAction<boolean>) => {
      _interface.fullscreen = action.payload;
    },
    setFullscreen: (_interface, action: PayloadAction<boolean>) => {
      _interface.fullscreen = action.payload;
    },
    toggleFullscreen: (_interface) => {
      _interface.fullscreen = !_interface.fullscreen;
    },
    // setControls: (_interface, action: PayloadAction<boolean>) => {
    //   _interface.controls = action.payload ? initial_interface.controls : "none";
    // },
    setRatio: (
      _interface,
      action: PayloadAction<string | [width: number, height: number]>,
    ) => {
      if (Array.isArray(action.payload)) {
        const [width, height] = action.payload;
        _interface.ratio = `${width}/${height}`;
      } else {
        _interface.ratio = action.payload;
      }
    },
    handleCueChange: (_interface, action: PayloadAction<string[]>) => {
      if (action.payload.length === 0) {
        _interface.activeCues = null;
      } else {
        _interface.activeCues = action.payload
          .flatMap((c) => c.split(/[\r\n]+/g))
          .map((c) => c.trim())
          .filter((c) => !!c)
          .join("\n");
      }
    },
    toggleTracks: (_interface) => {
      const enable = !_interface.textTracks.enabled;
      _interface.textTracks.enabled = enable;
      if (!enable) _interface.activeCues = null;
    },
    setActiveTrack: (_interface, action: PayloadAction<number>) => {
      const { list } = _interface.textTracks,
        newActive = action.payload;
      if (newActive >= 0 && newActive < list.length) {
        _interface.textTracks.active = newActive;
        _interface.textTracks.enabled = true;
      } else {
        console.error("caption index out of range", list.length);
      }
    },
    handleTrackListChange: (
      _interface,
      action: PayloadAction<InterfaceState["textTracks"]>,
    ) => {
      _interface.textTracks = action.payload;
    },
    setFilter: (_interface, action: PayloadAction<boolean>) => {
      _interface.filter = action.payload;
    },
    toggleFilter: (_interface) => {
      _interface.filter = !_interface.filter;
    },
  },
});

export default reducer;
export const {
  handleFullscreenChange,
  handleTrackListChange,
  setActiveTrack,
  setFilter,
  setFullscreen,
  setRatio,
  toggleFilter,
  toggleFullscreen,
  toggleTracks,
  handleCueChange,
} = actions;
