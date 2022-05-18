export const clampTime = (time: number, duration: number | null) => {
  if (duration && time > duration) {
    time = duration;
  } else if (time < 0) {
    time = 0;
  }
  return time;
};

import type { ControlledState } from "./controlled";

export const setVolumeTo = (newVolume: number, state: ControlledState) => {
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
