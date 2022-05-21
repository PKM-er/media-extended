import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { RootState } from "mx-store";

export * from "./thunk";

import initializePlayer from "./init-api";
export { initializePlayer };
const initAPIReducers = (builder: ActionReducerMapBuilder<RootState>) =>
  builder
    .addCase(initializePlayer.pending, ({ youtube }) => {
      youtube.playerStatus = "loading";
    })
    .addCase(initializePlayer.fulfilled, ({ youtube }) => {
      youtube.playerStatus = "inited";
    })
    .addCase(initializePlayer.rejected, ({ youtube }, action) => {
      youtube.playerStatus = "error";
      console.error(action.error, action.payload);
    });
export default initAPIReducers;
