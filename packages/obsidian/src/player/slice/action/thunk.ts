import { AppThunk, RootState } from "@player/store";

import { actionSlice } from "./slice";

const {
  requsetScreenshot: _reqScreenshot,
  requestTimestamp: _reqTimestamp,
  gotScreenshot: _gotScreenshot,
  gotTimestamp: _gotTimestamp,
} = actionSlice.actions;

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
    (buffer: ArrayBuffer, time: number, ext: "jpg" | "webp"): AppThunk =>
    (dispatch, getState) => {
      const state = getState();
      if (!selectScreenshotRequested(state)) return;

      const { source } = state.provider;

      if (!source) {
        console.error("failed to get screenshot: no source available", state);
      } else {
        console.info("screenshot captured", buffer.byteLength, source);
        app.workspace.trigger("mx:screenshot", buffer, time, ext, source);
      }
      dispatch(_gotScreenshot());
    },
  cancelScreenshot = (): AppThunk => (dispatch) => {
    console.info("screenshot cancelled");
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
    (currentTime: number | undefined, duration: number | undefined): AppThunk =>
    (dispatch, getState) => {
      const state = getState();
      if (!selectTimestampRequested(state)) return;
      if (!currentTime) {
        currentTime = state.controls.currentTime;
      }
      if (!duration && state.controls.duration) {
        duration = state.controls.duration;
      }
      const { source } = state.provider;
      if (!source) {
        console.error("no source available", state);
      } else if (!duration) {
        console.error("failed to get timestamp: no duration available", state);
      } else {
        console.info("got timestamp: ", currentTime, duration, source);
        app.workspace.trigger("mx:timestamp", currentTime, duration, source);
      }
      dispatch(_gotTimestamp());
    };
