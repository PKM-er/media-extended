import { AppThunk } from "@player/store";

import { selectPlayerType } from "../provider";
import { requsetSetVolumeByOffest as reqSetVolumeByOffestYtb } from "../youtube";
import { controlsSlice } from "./slice";

const {
  setPlaybackRate: _rate,
  setVolumeByOffest: _volumeOffset,
  setHash: _setHash,
  requestManualSeek,
  requestManualOffsetSeek,
  manualSeekDone,
} = controlsSlice.actions;

const trunc = (number: number) => Math.trunc(number * 20) / 20;
export const setPlaybackRate =
  (rate: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState(),
      type = selectPlayerType(state),
      { youtube } = state;
    if (type === "youtube") {
      const speeds = youtube.availableSpeeds;
      const max = speeds.length === 1 ? 2 : speeds[speeds.length - 1],
        min = speeds.length === 1 ? 0.25 : speeds[0];
      if (rate <= max && rate >= min) {
        dispatch(_rate(trunc(rate)));
      }
    } else {
      dispatch(_rate(rate));
    }
  };
export const setVolumeByOffest =
  (percent: number): AppThunk =>
  (dispatch, getState) => {
    const type = selectPlayerType(getState());
    if (type === "youtube") {
      dispatch(reqSetVolumeByOffestYtb(percent));
    } else dispatch(_volumeOffset(percent));
  };

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

export const setHash =
  (hash: string): AppThunk =>
  async (dispatch) => {
    // const { is } = new HashTool(hash);
    dispatch(_setHash(hash));
    // dispatch(setControls(is("controls")));
  };
