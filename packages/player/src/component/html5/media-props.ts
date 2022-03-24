import { useCallback } from "react";

import { useAppDispatch } from "../../app/hooks";
import {
  handleError,
  handleProgress,
  handleSeeked,
  handleSeeking,
  updateSeeking,
} from "../../slice/controls";
import { EventHandler } from "./event";
import { PlayerRef, useSubscribe } from "./utils";

export const useApplyPaused = (ref: PlayerRef) =>
  useSubscribe(
    (state) => state.controls.paused,
    ([paused], _dispatch, media) => {
      if (!media || media.paused === paused) return;
      media[paused ? "pause" : "play"]();
    },
    { immediate: true, ref },
  );
export const useSeeking = () => {
  const dispatch = useAppDispatch();

  const onSeeking = useCallback<EventHandler>(
      () => dispatch(handleSeeking()),
      [dispatch],
    ),
    onSeeked = useCallback<EventHandler>(
      () => dispatch(handleSeeked()),
      [dispatch],
    );

  return { onSeeking, onSeeked };
};

/* update seeking state on mount */
export const useUpdateSeekState = (ref: PlayerRef) => {
  useSubscribe(
    () => void 0,
    (_, dispatch, media) => {
      if (!media) return;
      dispatch(updateSeeking(media.instance.seeking));
    },
    { immediate: true, ref },
  );
};

const getBuffered = (media: HTMLMediaElement) => {
  const { buffered, currentTime } = media;
  for (let i = buffered.length - 1; i >= 0; i--) {
    if (buffered.start(i) <= currentTime) {
      return buffered.end(i);
    }
  }
  return null;
};

export const useProgress = () => {
  const dispatch = useAppDispatch();

  const update = useCallback<EventHandler>(
    (media) => {
      // https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/buffering_seeking_time_ranges#creating_our_own_buffering_feedback
      const buffered = getBuffered(media.instance);
      buffered && dispatch(handleProgress(buffered));
    },
    [dispatch],
  );
  return {
    onProgress: update,
    onCanPlay: update,
  };
};

/* update buffered state on mount */
export const useUpdateBuffer = (ref: PlayerRef) => {
  useSubscribe(
    (state) => state.provider,
    (_, dispatch, media) => {
      if (!media) return;
      const buffered = getBuffered(media.instance);
      buffered && dispatch(handleProgress(buffered));
    },
    { immediate: true, ref },
  );
};
export const useError = () => {
  const dispatch = useAppDispatch();
  return {
    onError: useCallback<EventHandler>(
      (media) => {
        const { error } = media.instance;
        if (error)
          dispatch(handleError({ message: error.message, code: error.code }));
      },
      [dispatch],
    ),
  };
};
