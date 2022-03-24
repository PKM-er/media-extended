import { useCallback } from "react";

import { useAppDispatch } from "../../app/hooks";
import {
  handleDurationChange,
  handleEnded,
  handlePause,
  handlePlaying,
  handleRateChange,
  handleTimeUpdate,
  handleVolumeChange,
  handleWaiting,
} from "../../slice/controls";
import { CoreEventHandler } from "../utils";
import { ApplyHookType } from "./utils";

export const useApplyPlaybackRate: ApplyHookType = (useSubscribe, ref) =>
  useSubscribe(
    (state) => state.controls.playbackRate,
    ([playbackRate], _dispatch, media) => {
      if (!media || media.playbackRate === playbackRate) return;
      media.playbackRate = playbackRate;
    },
    { immediate: true, ref },
  );
export const useApplyVolume: ApplyHookType = (useSubscribe, ref) =>
  useSubscribe(
    (state) => [state.controls.muted, state.controls.volume] as const,
    ([[muted, volume]], _dispatch, media) => {
      if (!media) return;
      media.volume !== volume && (media.volume = volume);
      media.muted !== muted && (media.muted = muted);
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
