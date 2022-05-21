import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "./utils";

export interface BiliState {
  webFscreen: boolean;
  danmaku: boolean;
}

const initialState: BiliState = {
  webFscreen: true,
  danmaku: false,
};

const slice = createSlice({
  name: "bilibili",
  initialState,
  getState: (s) => s.bilibili,
  setState: (r, s) => ((r.bilibili = s), void 0),
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
export const {
  enterWebFscreen,
  exitWebFscreen,
  handleWebFscreenChange,
  applyParentFullscreen,
  handleDanmakuChange,
  toggleDanmaku,
} = slice.actions;
export default slice;
