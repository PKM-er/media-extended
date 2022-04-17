import { AppThunk, RootState } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ActionState {
  /** null meaning feature not available */
  getScreenshot: boolean | null;
  getTimestamp: boolean;
}

const initialState: ActionState = {
  getScreenshot: null,
  getTimestamp: false,
};

export const actionSlice = createSlice({
  name: "action",
  initialState,
  reducers: {
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

export const { canScreenshot, resetCanScreenshot } = actionSlice.actions;
const {
  requsetScreenshot: _reqScreenshot,
  requestTimestamp: _reqTimestamp,
  gotScreenshot: _gotScreenshot,
  gotTimestamp: _gotTimestamp,
} = actionSlice.actions;

export default actionSlice.reducer;

export const selectScreenshotRequested = (state: RootState) =>
    state.action.getScreenshot === true,
  selectScreenshotSupported = (state: RootState) =>
    state.action.getScreenshot !== null,
  selectTimestampRequested = (state: RootState) =>
    state.action.getTimestamp === true;

const reqTimeout = 2e3;

export const requsetScreenshot = (): AppThunk => (dispatch, getState) => {
    dispatch(_reqScreenshot());
    window.setTimeout(() => {
      if (selectScreenshotRequested(getState())) {
        console.error("screenshot request timed out");
        dispatch(_gotScreenshot());
      }
    }, reqTimeout);
  },
  gotScreenshot =
    (buffer: ArrayBuffer | undefined): AppThunk =>
    (dispatch, getState) => {
      const state = getState();
      if (!selectScreenshotRequested(state)) return;

      const { source } = state.provider;

      if (buffer) {
        if (!source) {
          console.error("failed to get screenshot: no source available", state);
        } else {
          console.info("screenshot captured", buffer.byteLength, source);
          app.workspace.trigger("mx:screenshot", buffer, source);
        }
      } else {
        console.info("screenshot cancelled");
      }
      dispatch(_gotScreenshot());
    };

export const requestTimestamp = (): AppThunk => (dispatch, getState) => {
    dispatch(_reqTimestamp());
    window.setTimeout(() => {
      if (selectTimestampRequested(getState())) {
        console.error("timestamp request timed out");
        dispatch(_gotTimestamp());
      }
    }, reqTimeout);
  },
  gotTimestamp =
    (currentTime?: number): AppThunk =>
    (dispatch, getState) => {
      const state = getState();
      if (!selectTimestampRequested(state)) return;
      if (!currentTime) {
        currentTime = state.controls.currentTime;
      }
      const { source } = state.provider;
      if (!source) {
        console.error("no source available", state);
      } else {
        console.info("got timestamp: ", currentTime, source);
        app.workspace.trigger("mx:timestamp", currentTime, source);
      }
      dispatch(_gotTimestamp());
    };
