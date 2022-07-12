import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "../../../create-slice";
import { YoutubeAPIStatus } from "../../typings/youtube-api";

const { actions, reducer } = createSlice({
  name: "status",
  state: {} as YoutubeAPIStatus,
  reducers: {
    handlePlayerReady: (
      state,
      {
        payload: { duration, availableSpeeds },
      }: PayloadAction<{ availableSpeeds: number[]; duration: number }>,
    ) => {
      // state.YTAPIStatus = "ready";
      state.availableSpeeds = availableSpeeds;
      state.duration = duration;
    },
    destroyPlayer: (state) => {
      // state.YTAPIStatus = "inited";
    },
    handleStateChange: (state, action: PayloadAction<YT.PlayerState>) => {
      state.YTPlayerState = action.payload;
    },
  },
});

export default reducer;
export const { destroyPlayer, handlePlayerReady, handleStateChange } = actions;
