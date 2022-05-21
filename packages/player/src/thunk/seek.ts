import {
  manualSeekDone,
  requestManualOffsetSeek,
  requestManualSeek,
} from "mx-store";
import { AppThunk } from "mx-store";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const seekTo =
  (targetTime: number): AppThunk =>
  async (dispatch) => {
    dispatch(requestManualSeek(targetTime));
    await sleep(0);
    dispatch(manualSeekDone());
  };
export const seekByOffset =
  (second: number): AppThunk =>
  async (dispatch) => {
    if (second === 0) return;
    dispatch(requestManualOffsetSeek(second));
    await sleep(0);
    dispatch(manualSeekDone());
  };
