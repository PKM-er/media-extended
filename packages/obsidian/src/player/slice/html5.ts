import { createSlice } from "@reduxjs/toolkit";

export interface HTML5State {
  playerReady: boolean;
  availableSpeeds: number[];
}

const initialState: HTML5State = {
  playerReady: false,
  availableSpeeds: [1],
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
  },
});

export const { createPlayer, destroyPlayer } = HTML5Slice.actions;

export default HTML5Slice.reducer;
