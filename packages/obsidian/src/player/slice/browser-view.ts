import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export interface BrowserViewState {
  /** WebContents id */
  id: number;
  portReady: boolean;
  repositioning: boolean;
}

const initialState: BrowserViewState = {
  id: -1,
  portReady: false,
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
  state.browserView.id > -1;

export const {
  createPlayer,
  destroyPlayer,
  portReady,
  reposition,
  repositionDone,
} = BrowserViewSlice.actions;

export default BrowserViewSlice.reducer;
