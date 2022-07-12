import { useAppDispatch } from "@store-hooks";
import { CoreEventHandler } from "@utils";
import {
  handlePause,
  handlePlaying,
  handleRateChange,
  handleVolumeChange,
} from "mx-store";
import {
  handleDurationChange,
  handleEnded,
  handleTimeUpdate,
  handleWaiting,
} from "mx-store";
import { selectSpeed, selectVolumeMute } from "mx-store";
import { useCallback } from "react";

import { ApplyHookType } from "./utils";

export const useApplyPlaybackRate: ApplyHookType = (useSubscribe, ref) =>
  useSubscribe(
    selectSpeed,
    ([playbackRate], _dispatch, media) => {
      if (!media || !playbackRate || media.playbackRate === playbackRate)
        return;
      media.playbackRate = playbackRate;
    },
    { immediate: true, ref },
  );
export const useApplyVolume: ApplyHookType = (useSubscribe, ref) =>
  useSubscribe(
    selectVolumeMute,
    ([[muted, volume]], _dispatch, media) => {
      if (!media) return;
      if (volume !== undefined && media.volume !== volume) {
        media.volume = volume;
      }
      if (muted !== undefined && media.muted !== muted) {
        media.muted = muted;
      }
    },
    { immediate: true, ref },
  );

export const useStateEventHanlders = () => {
  const dispatch = useAppDispatch();

  return {
    onPlay: useCallback<CoreEventHandler>(
      () => dispatch(handlePlaying()),
      [dispatch],
    ),
    onPause: useCallback<CoreEventHandler>(
      () => dispatch(handlePause()),
      [dispatch],
    ),
    onRateChange: useCallback<CoreEventHandler>(
      (media) => {
        dispatch(handleRateChange(media.playbackRate));
      },
      [dispatch],
    ),
    onTimeUpdate: useCallback<CoreEventHandler>(
      (media) => {
        dispatch(handleTimeUpdate(media.currentTime));
      },
      [dispatch],
    ),
    onDurationChange: useCallback<CoreEventHandler>(
      (media) => {
        dispatch(handleDurationChange(media.duration));
      },
      [dispatch],
    ),
    onVolumeChange: useCallback<CoreEventHandler>(
      (media) => {
        const { volume, muted } = media;
        dispatch(handleVolumeChange({ volume, muted }));
      },
      [dispatch],
    ),
    onWaiting: useCallback<CoreEventHandler>(
      () => dispatch(handleWaiting()),
      [dispatch],
    ),
    onEnded: useCallback<CoreEventHandler>(
      () => dispatch(handleEnded()),
      [dispatch],
    ),
  };
};
