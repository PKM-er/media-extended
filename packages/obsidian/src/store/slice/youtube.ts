import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "./utils";

export interface YoutubeState {
  playerStatus: "none" | "loading" | "error" | "inited" | "ready";
  availableSpeeds: number[];
  /* changing this value will trigger volume update */
  volumeOffest: number | null;
  playerState: YT.PlayerState | null;
}

const initialState: YoutubeState = {
  playerStatus: "none",
  availableSpeeds: [1],
  volumeOffest: null,
  playerState: null,
};

const slice = createSlice({
  name: "youtube",
  initialState,
  getState: (s) => s.youtube,
  setState: (r, s) => ((r.youtube = s), void 0),
  reducers: {
    handlePlayerReady: (
      state,
      action: PayloadAction<{ availableSpeeds: number[]; duration: number }>,
    ) => {
      state.playerStatus = "ready";
      state.availableSpeeds = action.payload.availableSpeeds;
    },
    destroyPlayer: () => {
      return initialState;
    },
    // requsetSetVolumeByOffest: (state, action: PayloadAction<number>) => {
    //   state.volumeOffest = action.payload;
    // },
    setVolumeByOffestDone: (state) => {
      state.volumeOffest = null;
    },
    handleStateChange: (state, action: PayloadAction<YT.PlayerState>) => {
      state.playerState = action.payload;
    },
  },
});

export const {
  handlePlayerReady,
  // requsetSetVolumeByOffest,
  setVolumeByOffestDone,
  handleStateChange,
  destroyPlayer,
} = slice.actions;
export default slice;
