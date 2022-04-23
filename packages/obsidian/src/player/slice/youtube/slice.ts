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
  playerState: YT.PlayerState | null;
}

const initialState: YoutubeState = {
  playerStatus: "none",
  availableSpeeds: [1],
  volumeOffest: null,
  playerState: null,
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
        state.playerState = initialState.playerState;
      },
      requsetSetVolumeByOffest: (state, action: PayloadAction<number>) => {
        state.volumeOffest = action.payload;
      },
      setVolumeByOffestDone: (state) => {
        state.volumeOffest = null;
      },
      handleStateChange: (state, action: PayloadAction<YT.PlayerState>) => {
        state.playerState = action.payload;
      },
    },
    extraReducers,
  });
