import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export interface BrowserViewState {
  viewReady: boolean;
  portReady: boolean;
  repositioning: boolean;
}

const initialState: BrowserViewState = {
  viewReady: false,
  portReady: false,
  repositioning: false,
};

export const BrowserViewSlice = createSlice({
  name: "browser-view",
  initialState,
  reducers: {
    createPlayer: (state) => {
      state.viewReady = true;
    },
    destroyPlayer: (state) => {
      state.viewReady = false;
    },
    portReady: (state, action: PayloadAction<boolean>) => {
      state.portReady = action.payload;
    },
    reposition: (state) => {
      state.repositioning = true;
    },
    repositionDone: (state) => {
      state.repositioning = false;
    },
  },
});

export const selectBrowserViewReady = (state: RootState) =>
  state.browserView.viewReady;

export const {
  createPlayer,
  destroyPlayer,
  portReady,
  reposition,
  repositionDone,
} = BrowserViewSlice.actions;

export default BrowserViewSlice.reducer;
