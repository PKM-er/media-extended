// larger the value, lower the priority
export const enum UserSeekSource {
  MANUAL = 1,
  PROGRESS_BAR,
  KEYBOARD,
  DRAG,
}

export interface UserSeek {
  initialTime: number;
  currentTime: number;
  pausedBeforeSeek: boolean;
  source: UserSeekSource;
}

import { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from ".";
import { clampTime } from "./common";
import { createSlice } from "./utils";

/**
 * @returns negative: given has lower priority, 0 equal, positive: given higher
 */
const compareSeekPriority = (
  source: UserSeekSource,
  state: RootState,
): number => {
  if (!state.userSeek) return 1;
  const { source: toCompare } = state.userSeek;
  return toCompare - source;
};
const UserSeekEndReducerFor =
  (source: UserSeekSource) => (state: RootState) => {
    const priority = compareSeekPriority(source, state);
    if (priority < 0) return;
    if (!state.userSeek) return;
    if (state.userSeek.pausedBeforeSeek !== null) {
      state.controlled.paused = state.userSeek.pausedBeforeSeek;
    }
    // apply currentTime immediately to avoid latency from onTimeUpdate
    state.status.currentTime = state.userSeek.currentTime;
    state.userSeek = null;
  };
const PreciseSeekReducerFor =
  (source: UserSeekSource) =>
  (state: RootState, action: PayloadAction<number>) => {
    const priority = compareSeekPriority(source, state);
    if (priority < 0) return;
    const time = clampTime(action.payload, state.status.duration);
    if (priority === 0) {
      // only update seek time
      state.userSeek!.currentTime = time;
    } else {
      // new seek action or override existing seek action
      state.userSeek = {
        initialTime: time,
        currentTime: time,
        source,
        pausedBeforeSeek: state.controlled.paused,
      };
      // state.controlled.paused = true;
    }
  };
const OffsetSeekReducerFor =
  (
    source: UserSeekSource,
    onUpdate: (state: RootState, offset: number) => any,
  ) =>
  (state: RootState, action: PayloadAction<number>) => {
    const priority = compareSeekPriority(source, state);
    if (priority < 0) return;
    const offset = action.payload;
    if (priority === 0) {
      onUpdate(state, offset);
    } else {
      // new seek action or override existing seek action
      state.userSeek = {
        initialTime: state.status.currentTime,
        currentTime: clampTime(
          offset + state.status.currentTime,
          state.status.duration,
        ),
        source,
        pausedBeforeSeek: state.controlled.paused,
      };
      // state.controlled.paused = true;
    }
  };
const slice = createSlice({
  name: "userSeek",
  initialState: {} as RootState,
  getState: (s) => s,
  setState: (_r, s) => s,
  reducers: {
    progressBarSeek: PreciseSeekReducerFor(UserSeekSource.PROGRESS_BAR),
    progressBarSeekEnd: UserSeekEndReducerFor(UserSeekSource.PROGRESS_BAR),
    keyboardSeek: OffsetSeekReducerFor(
      UserSeekSource.KEYBOARD,
      (state, offset) => {
        state.userSeek!.currentTime = clampTime(
          offset + state.userSeek!.currentTime,
          state.status.duration,
        );
      },
    ),
    keyboardSeekEnd: UserSeekEndReducerFor(UserSeekSource.KEYBOARD),
    dragSeek: (state, action: PayloadAction<number>) => {
      const source = UserSeekSource.DRAG;
      const priority = compareSeekPriority(source, state);
      if (priority < 0) return;
      if (priority > 0) {
        // new seek action
        let time = state.status.currentTime;
        state.userSeek = {
          initialTime: time,
          currentTime: time,
          source,
          pausedBeforeSeek: state.controlled.paused,
        };
        // state.controlled.paused = true;
      } else {
        const forwardSeconds = action.payload;
        const { initialTime } = state.userSeek!,
          { duration } = state.status;
        state.userSeek!.currentTime = clampTime(
          forwardSeconds + initialTime,
          duration,
        );
      }
    },
    dragSeekEnd: UserSeekEndReducerFor(UserSeekSource.DRAG),
    requestManualSeek: (state, action: PayloadAction<number>) => {
      const source = UserSeekSource.MANUAL;
      const priority = compareSeekPriority(source, state);
      if (priority < 0) return;
      if (priority === 0)
        throw new Error(
          "manual seek request is called before manual seek ends",
        );
      let time = action.payload;
      time = clampTime(time, state.status.duration);
      state.userSeek = {
        initialTime: time,
        currentTime: time,
        source,
        pausedBeforeSeek: state.controlled.paused,
      };
      // state.controlled.paused = true;
    },
    requestManualOffsetSeek: OffsetSeekReducerFor(UserSeekSource.MANUAL, () => {
      throw new Error("manual seek request is called before manual seek ends");
    }),
    manualSeekDone: UserSeekEndReducerFor(UserSeekSource.MANUAL),
  },
});
export const {
  dragSeek,
  dragSeekEnd,
  keyboardSeek,
  keyboardSeekEnd,
  manualSeekDone,
  progressBarSeek,
  progressBarSeekEnd,
  requestManualOffsetSeek,
  requestManualSeek,
} = slice.actions;
export default slice.reducers;
