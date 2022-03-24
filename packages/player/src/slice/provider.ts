import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AppThunk } from "../app/store";
import { reset as resetControls } from "./controls";
import { resetRatio } from "./interface";

interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}

interface Source {
  src: string;
  type?: string;
}

interface Subtitle {
  src: string;
  kind: "subtitles";
  // must be a valid BCP 47 language tag
  srcLang: string;
  label: string;
  default: boolean;
}

type Track = Caption | Subtitle;
type ProviderType = "video" | "audio" | "youtube" | "vimeo" | null;

export interface ProviderState {
  from: ProviderType;
  sources: Source[];
  tracks: Track[];
}

const initialState: ProviderState = {
  from: null,
  sources: [],
  tracks: [],
};

export interface ProviderInfo {
  from: ProviderType;
  sources: (string | Source)[];
  tracks?: Track[];
}

export const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<ProviderInfo>) => {
      if (action.payload) {
        const { from, sources, tracks } = action.payload;
        state.from = from;
        state.sources = sources.map((src) =>
          typeof src === "string" ? { src } : src,
        );
        state.tracks = tracks ?? [];
      }
    },
    resetProvider: (state) => {
      state.from = null;
      state.sources = [];
      state.tracks = [];
    },
    switchToAudio: (state) => {
      state.from && (state.from = "audio");
    },
  },
});

export const { switchToAudio } = providerSlice.actions;
const { setProvider: _set, resetProvider: _reset } = providerSlice.actions;

export const setProvider =
  (info: ProviderInfo): AppThunk =>
  async (dispatch) => {
    dispatch(resetControls());
    dispatch(resetRatio());
    dispatch(_set(info));
  };
export const resetProvider = (): AppThunk => async (dispatch) => {
  dispatch(resetControls());
  dispatch(resetRatio());
  dispatch(_reset());
};

export default providerSlice.reducer;
