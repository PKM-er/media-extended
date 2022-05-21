import {
  gotScreenshot as _gotScreenshot,
  gotTimestamp as _gotTimestamp,
  requestTimestamp as _reqTimestamp,
  requsetScreenshot as _reqScreenshot,
} from "mx-store";
import {
  AppThunk,
  selectScreenshotRequested,
  selectTimestampRequested,
} from "mx-store";

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

      if (!state.meta.provider === null) {
        console.error(
          "failed to get screenshot: no source available",
          state.meta,
        );
      } else {
        console.info("screenshot captured", buffer.byteLength, state.meta);
        app.workspace.trigger("mx:screenshot", buffer, time, ext, state.meta);
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
        currentTime = state.status.currentTime;
      }
      if (!duration && state.status.duration) {
        duration = state.status.duration;
      }
      if (!state.meta.provider === null) {
        console.error("no source available", state);
      } else if (!duration) {
        console.error(
          "failed to get timestamp: no duration available",
          state.meta,
        );
      } else {
        console.info("got timestamp: ", currentTime, duration, state.meta);
        app.workspace.trigger(
          "mx:timestamp",
          currentTime,
          duration,
          state.meta,
        );
      }
      dispatch(_gotTimestamp());
    };
