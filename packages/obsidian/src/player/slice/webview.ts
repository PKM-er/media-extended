import { createSlice } from "@reduxjs/toolkit";

export interface WebviewState {
  playerReady: boolean;
}

const initialState: WebviewState = {
  playerReady: false,
};

export const WebviewSlice = createSlice({
  name: "webview",
  initialState,
  reducers: {
    createPlayer: (state) => {
      state.playerReady = true;
    },
    destroyPlayer: (state) => {
      state.playerReady = false;
    },
  },
});

export const { createPlayer, destroyPlayer } = WebviewSlice.actions;

export default WebviewSlice.reducer;
