import { createSlice } from "@reduxjs/toolkit";

export interface HTML5State {
  playerReady: boolean;
  captureScreenshot: boolean;
}

const initialState: HTML5State = {
  playerReady: false,
  captureScreenshot: false,
};

export const HTML5Slice = createSlice({
  name: "html5",
  initialState,
  reducers: {
    createPlayer: (state) => {
      state.playerReady = true;
    },
    destroyPlayer: (state) => {
      state.playerReady = false;
    },
    captureScreenshot: (state) => {
      state.captureScreenshot = true;
    },
    captureScreenshotDone: (state) => {
      state.captureScreenshot = false;
    },
  },
});

export const {
  createPlayer,
  destroyPlayer,
  captureScreenshot,
  captureScreenshotDone,
} = HTML5Slice.actions;

export default HTML5Slice.reducer;
