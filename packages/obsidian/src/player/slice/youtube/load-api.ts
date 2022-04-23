import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

import initializePlayer from "../async-thunk/load-ytb-api";
import { YoutubeState } from "./slice";

const getFetchMetaActionReducer = (
  builder: ActionReducerMapBuilder<YoutubeState>,
) => {
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
};
export default getFetchMetaActionReducer;
