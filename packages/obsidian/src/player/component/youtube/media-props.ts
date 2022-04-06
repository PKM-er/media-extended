import { useAppDispatch, useAppSelector } from "@player/hooks";
import { AppDispatch } from "@player/store";
import {
  handleDurationChange,
  handleEnded,
  handleError,
  handlePause,
  handlePlaying,
  handleProgress,
  handleSeeked,
  handleTimeUpdate,
  handleWaiting,
} from "@slice/controls";
import { useMemoizedFn } from "ahooks";
import assertNever from "assert-never";

import { EventHandlers } from "./event";
import { PlayerRef, useSubscribe } from "./utils";

export const useApplyPaused = (ref: PlayerRef) =>
  useSubscribe(
    (state) => state.controls.paused,
    ([paused], _dispatch, media) => {
      const state = media.instance.getPlayerState();
      if (paused && state === YT.PlayerState.PLAYING) {
        media.pause();
      } else if (
        !paused &&
        (state === YT.PlayerState.PAUSED ||
          state === YT.PlayerState.CUED ||
          state === YT.PlayerState.UNSTARTED)
      ) {
        media.play();
      }
    },
    { immediate: true, ref },
  );

export const useStateChangeHandler = () => {
  const dispatch = useAppDispatch();
  const seeking = useAppSelector((state) => state.controls.seeking),
    loop = useAppSelector((state) => state.controls.loop),
    autoplay = useAppSelector((state) => state.controls.autoplay),
    paused = useAppSelector((state) => state.controls.paused),
    hasStarted = useAppSelector((state) => state.controls.hasStarted),
    duration = useAppSelector((state) => state.controls.duration),
    customControls = useAppSelector(
      (state) => state.interface.controls === "custom",
    ),
    muted = useAppSelector((state) => state.controls.muted);
  const onStateChange = useMemoizedFn<EventHandlers["onStateChange"]>(
    ({ data, target: instance }) => {
      const seeked =
        seeking &&
        [YT.PlayerState.PLAYING, YT.PlayerState.PAUSED].includes(data);

      if (seeked) {
        // Unset seeking and fire seeked event
        dispatch(handleSeeked());
      }

      switch (data) {
        case YT.PlayerState.UNSTARTED:
          dispatch(handleTimeUpdate(0));
          dispatchBuffer(instance, dispatch, duration);
          break;
        case YT.PlayerState.ENDED: {
          // YouTube doesn't support loop for a single video, so mimick it.
          if (loop) {
            // YouTube needs a call to `stopVideo` before playing again
            instance.stopVideo();
            instance.playVideo();
          } else {
            dispatch(handleEnded());
          }
          break;
        }
        case YT.PlayerState.PLAYING: {
          // Restore paused state (YouTube starts playing on seek if the video hasn't been played yet)
          if (customControls && !autoplay && paused && !hasStarted) {
            dispatch(handlePause());
          } else {
            dispatch(handlePlaying());
            // Check duration again due to YouTube bug
            // https://github.com/sampotts/plyr/issues/374
            // https://code.google.com/p/gdata-issues/issues/detail?id=8690
            const latestDuration = instance.getDuration();
            if (duration !== latestDuration) {
              dispatch(handleDurationChange(latestDuration));
            }
          }
          break;
        }
        case YT.PlayerState.PAUSED: {
          // Restore audio (YouTube starts playing on seek if the video hasn't been played yet)
          if (!muted) {
            instance.unMute();
          }
          dispatch(handlePause());
          break;
        }
        case YT.PlayerState.BUFFERING:
          dispatch(handleWaiting());
          break;
        case YT.PlayerState.CUED:
          break;
        default:
          assertNever(data);
      }
    },
  );
  return { onStateChange };
};

const dispatchBuffer = (
  player: YT.Player,
  dispatch: AppDispatch,
  duration: number | null,
) => {
  const fraction = player.getVideoLoadedFraction();
  duration = duration || player.getDuration();
  typeof fraction === "number" &&
    duration &&
    dispatch(handleProgress(fraction * duration));
};

export const useProgress = () => {
  const dispatch = useAppDispatch();
  const duration = useAppSelector((state) => state.controls.duration);
  return {
    onProgress: useMemoizedFn<EventHandlers["onProgress"]>(({ target }) =>
      dispatchBuffer(target, dispatch, duration),
    ),
  };
};
export const useUpdateSeekState = (ref: PlayerRef) => {
  const duration = useAppSelector((state) => state.controls.duration);
  useSubscribe(
    (state) => state.provider,
    (_, dispatch, media) => {
      dispatchBuffer(media.instance, dispatch, duration);
    },
    { immediate: true, ref },
  );
};

// Messages copied from https://developers.google.com/youtube/iframe_api_reference#onError
const errorMessages = {
  2: "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.",
  5: "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.",
  100: "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.",
  101: "The owner of the requested video does not allow it to be played in embedded players.",
  150: "The owner of the requested video does not allow it to be played in embedded players.",
};

export const useError = () => {
  const dispatch = useAppDispatch(),
    prevError = useAppSelector((state) => state.controls.error);
  return {
    onError: useMemoizedFn<EventHandlers["onError"]>(({ data: code }) => {
      // YouTube may fire onError twice, so only handle it once
      if (!prevError) {
        const message = errorMessages[code] || "An unknown error occured";
        dispatch(handleError({ message, code }));
      }
    }),
  };
};
