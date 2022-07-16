import {
  AnyAction,
  createAction as _createAction,
  PayloadActionCreator,
} from "@reduxjs/toolkit";
import { SeekToOptions } from "mx-base";

type MediaControlAction<
  P = void,
  T extends string = string,
> = PayloadActionCreator<P, T> & {
  $mediaControl: true;
};

export const actionPrefix = "mediaControl/";

const createAction = <P = void, T extends string = string>(type: T) => {
  const actionCreator = _createAction(actionPrefix + type) as any;
  return ((...args: any[]) => {
    let action = actionCreator(...args);
    action.$mediaControl = true;
    return action;
  }) as MediaControlAction<P, T>;
};

export const isActionMediaControl = (action: AnyAction) =>
  !!(action as MediaControlAction).$mediaControl;

type SeekParams = { value: number } & SeekToOptions;

interface EventTypeMap {
  play: void;
  pause: void;
  togglePlay: void;
  setMute: boolean;
  toggleMute: void;
  setVolume: number;
  setVolumeUnmute: number;
  setPlaybackRate: number;
  setVolumeByOffest: number;
  seekTo: number | SeekParams;
  seekByOffset: number | SeekParams;
}

export type EventMap = {
  [K in keyof EventTypeMap]: (
    ...args: EventTypeMap[K] extends void
      ? []
      : EventTypeMap[K] extends Array<any>
      ? EventTypeMap[K]
      : [EventTypeMap[K]]
  ) => void;
};

type Actions = {
  [Name in keyof EventTypeMap]: MediaControlAction<
    EventTypeMap[Name],
    `${typeof actionPrefix}${Name}`
  >;
};

type Invalid<T> = ["Needs to be all of", T];
const arrayOfAll =
  <T>() =>
  <U extends T[]>(
    ...array: U & ([T] extends [U[number]] ? unknown : Invalid<T>[])
  ) =>
    array;

const actionNames = arrayOfAll<keyof EventTypeMap>()(
  "play",
  "pause",
  "togglePlay",
  "setMute",
  "toggleMute",
  "setVolume",
  "setVolumeUnmute",
  "setPlaybackRate",
  "setVolumeByOffest",
  "seekTo",
  "seekByOffset",
);

// actions declared here will be handled by middleware
// and apply to player directly
export const {
  pause,
  play,
  setMute,
  setPlaybackRate,
  setVolume,
  setVolumeByOffest,
  setVolumeUnmute,
  toggleMute,
  togglePlay,
  seekTo,
  seekByOffset,
} = actionNames.reduce(
  (map, name) => ((map[name] = createAction(name) as any), map),
  {} as Actions,
);
