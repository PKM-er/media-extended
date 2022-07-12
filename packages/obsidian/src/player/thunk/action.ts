import {
  gotScreenshot as _gotScreenshot,
  gotTimestamp as _gotTimestamp,
  requestTimestamp as _reqTimestamp,
  requsetScreenshot as _reqScreenshot,
  selectCurrentTime,
  selectDuration,
  selectMeta,
  selectTimeDuration,
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

      const meta = selectMeta(state);
      if (!meta?.provider) {
        console.error("failed to get screenshot: no source available", meta);
      } else {
        console.info("screenshot captured", buffer.byteLength, meta);
        app.workspace.trigger("mx:screenshot", buffer, time, ext, meta);
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
    (
      currentTime: number | undefined,
      duration: number | null | undefined,
    ): AppThunk =>
    (dispatch, getState) => {
      const state = getState();
      if (!selectTimestampRequested(state)) return;
      currentTime = currentTime ?? selectCurrentTime(state);
      duration = duration ?? selectDuration(state);
      const meta = selectMeta(state);
      if (!meta?.provider) {
        console.error("failed to get timestamp: no source available", state);
      } else if (currentTime === undefined || duration === undefined) {
        console.error(
          "failed to get timestamp: no current time available",
          meta,
        );
      } else {
        console.info("got timestamp: ", currentTime, duration, meta);
        app.workspace.trigger("mx:timestamp", currentTime, duration, meta);
      }
      dispatch(_gotTimestamp());
    };
