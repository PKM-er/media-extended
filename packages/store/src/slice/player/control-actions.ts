import {
  createAction as _createAction,
  PayloadActionCreator,
} from "@reduxjs/toolkit";

const createAction = <P = void, T extends string = string>(type: T) => {
  const action = _createAction(type) as PayloadActionCreator<P, T> & {
    $mediaControl: true;
  };
  action.$mediaControl = true;
  return action;
};

export const play = createAction("mediaControl/play"),
  pause = createAction("mediaControl/pause"),
  togglePlay = createAction("mediaControl/togglePlay"),
  setMute = createAction<boolean>("mediaControl/setMute"),
  toggleMute = createAction("mediaControl/toggleMute"),
  setVolume = createAction<number>("mediaControl/setVolume"),
  setVolumeUnmute = createAction<number>("mediaControl/setVolumeUnmute"),
  setPlaybackRate = createAction<number>("mediaControl/setPlaybackRate"),
  setVolumeByOffest = createAction<number>("mediaControl/setVolumeByOffest");
