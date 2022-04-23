import {
  ActionReducerMapBuilder,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

export interface YoutubeState {
  playerStatus: "none" | "loading" | "error" | "inited" | "ready";
  availableSpeeds: number[];
  /* changing this value will trigger volume update */
  volumeOffest: number | null;
}

const initialState: YoutubeState = {
  playerStatus: "none",
  availableSpeeds: [1],
  volumeOffest: null,
};

export const getYoutubeSlice = (
  extraReducers?: (builder: ActionReducerMapBuilder<YoutubeState>) => void,
) =>
  createSlice({
    name: "youtube",
    initialState,
    reducers: {
      handlePlayerReady: (
        state,
        action: PayloadAction<{ availableSpeeds: number[] }>,
      ) => {
        state.playerStatus = "ready";
        state.availableSpeeds = action.payload.availableSpeeds;
      },
      destroyPlayer: (state) => {
        state.playerStatus = "none";
        state.availableSpeeds = initialState.availableSpeeds;
      },
      requsetSetVolumeByOffest: (state, action: PayloadAction<number>) => {
        state.volumeOffest = action.payload;
      },
      setVolumeByOffestDone: (state) => {
        state.volumeOffest = null;
      },
    },
    extraReducers,
  });
