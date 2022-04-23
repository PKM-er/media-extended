import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BiliState {
  webFscreen: boolean;
  danmaku: boolean;
}

const initialState: BiliState = {
  webFscreen: false,
  danmaku: false,
};

export const biliSlice = createSlice({
  name: "bilibili",
  initialState,
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
} = biliSlice.actions;

export default biliSlice.reducer;
