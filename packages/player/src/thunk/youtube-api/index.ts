import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { RootState } from "mx-store";

export * from "./thunk";

import { initAPI } from "./init-api";

export { initAPI, initPlayer } from "./init-api";

export const initYoutubeAPIReducers = (
  builder: ActionReducerMapBuilder<RootState>,
) =>
  builder
    .addCase(initAPI.pending, ({ youtube }) => {
      youtube.playerStatus = "loading";
    })
    .addCase(initAPI.fulfilled, ({ youtube }) => {
      youtube.playerStatus = "inited";
    })
    .addCase(initAPI.rejected, ({ youtube }, action) => {
      youtube.playerStatus = "error";
      console.error("failed to load YouTube API", action.error, action.payload);
    });
