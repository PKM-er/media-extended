import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "../../../create-slice";
import { BilibiliStatus } from "../../typings/bilibili";

const { actions, reducer } = createSlice({
  name: "status",
  state: {} as BilibiliStatus,
  reducers: {
    enterWebFscreen: (state) => {
      state.webFscreen = true;
    },
    exitWebFscreen: (state) => {
      state.webFscreen = false;
    },
    handleWebFscreenChange: (state, action: PayloadAction<boolean>) => {
      state.webFscreen = action.payload;
    },
    // dispatched when parent obsidian player enter fullscreen
    applyParentFullscreen: (state) => {
      state.webFscreen = true;
    },
    handleDanmakuChange: (state, action: PayloadAction<boolean>) => {
      state.danmaku = action.payload;
    },
    toggleDanmaku: (state) => {
      state.danmaku = !state.danmaku;
    },
  },
});

export default reducer;
export const {
  applyParentFullscreen,
  enterWebFscreen,
  exitWebFscreen,
  handleDanmakuChange,
  handleWebFscreenChange,
  toggleDanmaku,
} = actions;
