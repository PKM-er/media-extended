import { AppThunk, RootState } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ActionState {
  platform: "ios" | "other" | null;
  /** null meaning feature not available */
  getScreenshot: boolean | null;
  getTimestamp: boolean;
}

const initialState: ActionState = {
  platform: null,
  getScreenshot: null,
  getTimestamp: false,
};

export const actionSlice = createSlice({
  name: "action",
  initialState,
  reducers: {
    setPlatform: (state, action: PayloadAction<"ios" | "other">) => {
      state.platform = action.payload;
    },
    canScreenshot: (state, action: PayloadAction<boolean>) => {
      state.getScreenshot = action.payload ? false : null;
    },
    resetCanScreenshot: (state) => {
      state.getScreenshot = null;
    },
    requsetScreenshot: (state) => {
      if (state.getScreenshot !== null) {
        state.getScreenshot = true;
      }
    },
    gotScreenshot: (state) => {
      if (state.getScreenshot !== null) {
        state.getScreenshot = false;
      }
    },
    requestTimestamp: (state) => {
      state.getTimestamp = true;
    },
    gotTimestamp: (state) => {
      state.getTimestamp = false;
    },
  },
});
