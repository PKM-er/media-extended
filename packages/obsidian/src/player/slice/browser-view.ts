import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export interface BrowserViewState {
  /** WebContents id */
  id: number;
  repositioning: boolean;
}

const initialState: BrowserViewState = {
  id: -1,
  repositioning: false,
};

export const BrowserViewSlice = createSlice({
  name: "browser-view",
  initialState,
  reducers: {
    createPlayer: (state, action: PayloadAction<number>) => {
      state.id = action.payload;
    },
    destroyPlayer: (state) => {
      state.id = -1;
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
  state.browserView.id > -1;

export const { createPlayer, destroyPlayer, reposition, repositionDone } =
  BrowserViewSlice.actions;

export default BrowserViewSlice.reducer;
