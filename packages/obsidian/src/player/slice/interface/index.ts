import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Controls = "native" | "custom" | "none";

type Track = Pick<TextTrack, "kind" | "label" | "language">;

export interface InterfaceState {
  controls: Controls;
  /**
   * string: "16/9"
   * 0: no ratio (e.g. audio)
   * null: ratio not available
   */
  ratio: string | 0 | null;
  activeCues: string | null;
  captions: {
    list: Track[];
    active: number;
    enabled: boolean;
  };
  ignoreEvent: {
    caption: boolean;
  };
}

const initialState: InterfaceState = {
  controls: "custom",
  ratio: null,
  activeCues: null,
  captions: { list: [], active: -1, enabled: true },
  ignoreEvent: { caption: false },
};

export const interfaceSlice = createSlice({
  name: "interface",
  initialState,
  reducers: {
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
    toggleCaption: (state) => {
      const enable = !state.captions.enabled;
      state.captions.enabled = enable;
      if (!enable) state.activeCues = null;
    },
    setActiveCaption: (state, action: PayloadAction<number>) => {
      const { list } = state.captions,
        newActive = action.payload;
      if (newActive >= 0 && newActive < list.length) {
        state.captions.active = newActive;
        state.captions.enabled = true;
      } else {
        console.error("caption index out of range", list.length);
      }
    },
    lockCaptionUpdateEvent: (state) => {
      state.ignoreEvent.caption = true;
    },
    unlockCaptionUpdateEvent: (state) => {
      state.ignoreEvent.caption = false;
    },
    handleTrackListChange: (
      state,
      action: PayloadAction<InterfaceState["captions"]>,
    ) => {
      if (!state.ignoreEvent.caption) state.captions = action.payload;
    },
  },
});

export const {
  /* setControls, */ setRatio,
  resetInterface,
  updateCues,
  handleTrackListChange,
  lockCaptionUpdateEvent,
  setActiveCaption,
  toggleCaption,
  unlockCaptionUpdateEvent,
} = interfaceSlice.actions;

export default interfaceSlice.reducer;
