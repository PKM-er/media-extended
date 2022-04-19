import { AppThunk } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PlayerRef } from "../component/youtube/utils";
import initializePlayer from "./thunks/load-ytb-api";
import loadYoutubeAPI from "./thunks/load-ytb-api";

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

export const youtubeSlice = createSlice({
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
  extraReducers: (builder) => {
    builder
      .addCase(initializePlayer.pending, (state) => {
        state.playerStatus = "loading";
      })
      .addCase(initializePlayer.fulfilled, (state) => {
        state.playerStatus = "inited";
      })
      .addCase(initializePlayer.rejected, (state, action) => {
        state.playerStatus = "error";
        console.error(action.error, action.payload);
      });
  },
});

export const destroyPlayer =
  (playerRef: PlayerRef): AppThunk =>
  (dispatch) => {
    // dispatch event to notify the player will be destroyed
    // then destroy the player
    dispatch(youtubeSlice.actions.destroyPlayer());
    if (playerRef.current) {
      const playerToDestroy = playerRef.current;
      setTimeout(() => {
        playerToDestroy.destroy();
      }, 0);
      playerRef.current = null;
    }
  };
export const resetPlayer =
  (playerRef: PlayerRef, playerEl: HTMLElement, videoId: string): AppThunk =>
  (dispatch) => {
    dispatch(destroyPlayer(playerRef));
    dispatch(initializePlayer([playerRef, playerEl, videoId]));
  };
export const {
  handlePlayerReady,
  requsetSetVolumeByOffest,
  setVolumeByOffestDone,
} = youtubeSlice.actions;
export { default as initializePlayer } from "./thunks/load-ytb-api";

export default youtubeSlice.reducer;
