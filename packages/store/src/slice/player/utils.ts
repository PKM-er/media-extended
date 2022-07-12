import { createAction } from "@reduxjs/toolkit";

import { BasicPlayerStatus } from "./typings";

export const clampTime = (time: number, duration: number | null) => {
  if (duration && time > duration) {
    time = duration;
  } else if (time < 0) {
    time = 0;
  }
  return time;
};

export const setVolumeTo = (newVolume: number, state: BasicPlayerStatus) => {
  if (newVolume < 0) {
    state.volume = 0;
  } else if (newVolume > 1) {
    state.volume = 1;
  } else {
    state.volume = newVolume;
  }
};

export const checkDuration = (duration: unknown): duration is number =>
  typeof duration === "number" && !!duration && duration > 0;

export const trunc = (number: number) => Math.trunc(number * 20) / 20;

export const createPlayerAction: typeof createAction = ((
  type: string,
  ...args: any
) => (createAction as any)("player/" + type, ...args)) as any;
