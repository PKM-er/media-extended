import { AnyAction, PayloadAction } from "@reduxjs/toolkit";
import { Fragment, getFragFromHash, is } from "mx-base";
import { isTimestamp } from "mx-lib";
import { parse as parseQS } from "query-string";

import { AppThunk } from "../../../../utils";
import { createSlice } from "../../../create-slice";
import { BasicPlayerStatus } from "../../typings";
import { checkDuration, setVolumeTo } from "../../utils";

export const LARGE_CURRENT_TIME = 1e101;

export const handleDuration = (
  status: BasicPlayerStatus,
  duration: number | null,
) => {
  if (checkDuration(duration)) {
    status.duration = duration;
  } else {
    status.duration === null;
  }
};

type HashProps = [hash: string, fromLink?: boolean];

const { actions, reducer } = createSlice({
  name: "status",
  state: {} as BasicPlayerStatus,
  reducers: {
    setHash: (state, action: PayloadAction<HashProps>) => {
      const [hash] = action.payload;
      const query = parseQS(hash),
        frag = getFragFromHash(hash);
      state.fragment = frag;
      state.loop = is(query, "loop");
      state.autoplay = is(query, "autoplay");
    },
    setFragment: (state, action: PayloadAction<Fragment | null>) => {
      const frag = action.payload;
      state.fragment = frag;
    },
    handleLoopChange: (status, action: PayloadAction<boolean>) => {
      status.loop = action.payload;
    },
    handleAutoplayChange: (status, action: PayloadAction<boolean>) => {
      status.autoplay = action.payload;
    },
    handleVolumeChange: (
      status,
      {
        payload: { volume, muted },
      }: PayloadAction<{ volume: number; muted: boolean }>,
    ) => {
      setVolumeTo(volume, status);
      status.muted = muted;
    },
    handlePlaying: (status) => {
      status.paused = false;
      status.ended = false;
      status.waiting = false;
      status.hasStarted = true;
    },
    handlePause: (status) => {
      status.paused = true;
    },
    handleRateChange: (status, action: PayloadAction<number>) => {
      status.playbackRate = action.payload;
    },
    handleTimeUpdate: (status, action: PayloadAction<number>) => {
      if (action.payload !== LARGE_CURRENT_TIME)
        status.currentTime = action.payload;
      if (status.duration === action.payload) {
        status.ended = true;
      }
    },
    handleDurationChange: (status, action: PayloadAction<number | null>) =>
      handleDuration(status, action.payload),
    handleSeeking: (status) => {
      status.seeking = true;
    },
    handleSeeked: (status) => {
      status.seeking = false;
    },
    handleProgress: (
      status,
      action: PayloadAction<{ buffered: number; duration: number }>,
    ) => {
      const { buffered, duration } = action.payload;
      if (buffered >= 0) {
        status.buffered = buffered;
      } else {
        console.error("invaild buffered value", action.payload);
      }
      if (checkDuration(duration)) {
        status.duration = duration;
      }
    },
    handleEnded: (status) => {
      status.ended = true;
    },
    handleWaiting: (status) => {
      status.waiting = true;
    },
    handleError: (
      status,
      action: PayloadAction<{ message: string; code?: number }>,
    ) => {
      status.error = `${action.payload.message} (${action.payload.code})`;
    },
    updateBasicInfo: (
      status,
      action: PayloadAction<{
        seeking: boolean;
        duration: number;
        buffered: number | null;
      }>,
    ) => {
      const { buffered, duration, seeking } = action.payload;
      if (buffered && buffered >= 0) {
        status.buffered = buffered;
      } else if (buffered !== null) {
        console.error("invaild buffered value", action.payload);
      }
      if (checkDuration(duration)) {
        status.duration = duration;
      }
      status.seeking = seeking;
    },
    // revert duration from cache when player is reloaded
    revertDuration: (status, action: PayloadAction<number>) => {
      status.duration = action.payload;
    },
  },
});

export default reducer;
export const {
  handleAutoplayChange,
  handleDurationChange,
  handleEnded,
  handleError,
  handleLoopChange,
  handlePause,
  handlePlaying,
  handleProgress,
  handleRateChange,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleVolumeChange,
  handleWaiting,
  updateBasicInfo,
  revertDuration,
} = actions;

export const setHash =
  ([hash, fromLink = false]: HashProps): AppThunk =>
  (dispatch, _, emitter) => {
    dispatch(actions.setHash([hash, fromLink]));
    const query = parseQS(hash);
    emitter.emit("setMute", is(query, "muted"));
    // start playing when link is opened
    if (fromLink) emitter.emit("play");
  };

export const setFragment =
  (frag: Fragment | null): AppThunk =>
  (dispatch, _, emitter) => {
    dispatch(actions.setFragment(frag));
    // start playing when timestamp is seeked to
    if (frag && isTimestamp(frag)) emitter.emit("play");
  };
