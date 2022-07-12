import { YoutubeMedia } from "@utils/media";
import assertNever from "assert-never";
import {
  handleDurationChange,
  handleEnded,
  handleError,
  handlePause,
  handlePlaying,
  handleSeeked,
  handleStateChange,
  handleTimeUpdate,
  handleWaiting,
  PlayerStore,
  PlayerType,
  selectAutoplay,
  selectDuration,
  selectError,
  selectHasStarted,
  selectIsCustomControls,
  selectLoop,
  selectMuted,
  selectPaused,
  selectSeeking,
} from "mx-store";
import { YoutubeAPIStatus } from "mx-store/src/slice/player/typings/youtube-api";
import { EventHandlers } from "mx-youtube";

import { updateBufferYtb } from "../common";
import generalEventHandlers from "./general";

// Messages copied from https://developers.google.com/youtube/iframe_api_reference#onError
const errorMessages = {
  2: "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.",
  5: "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.",
  100: "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.",
  101: "The owner of the requested video does not allow it to be played in embedded players.",
  150: "The owner of the requested video does not allow it to be played in embedded players.",
};

const getYoutubeEventHandlers = (store: PlayerStore) => {
  const {
    handlers: { ratechange, play, timeupdate },
    unload,
  } = generalEventHandlers<YoutubeMedia>(store);

  const onerror: EventHandlers["onError"] = ({ data: code }) => {
    // YouTube may fire onError twice, so only handle it once
    if (!selectError(store.getState())) {
      const message = errorMessages[code] || "An unknown error occured";
      store.dispatch(handleError({ message, code }));
    }
  };
  const onStateChange: EventHandlers["onStateChange"] = (evt) => {
    getStateChangeHandler(store)(evt);
    if (evt.data === YT.PlayerState.PLAYING) {
      play(new YoutubeMedia(evt.target));
    }
  };
  const handlers = {
    ratechange,
    timeupdate,
    progress: ({ instance }: YoutubeMedia) => {
      updateBufferYtb(
        instance,
        store.dispatch,
        selectDuration(store.getState()),
      );
    },
    error: onerror,
    onStateChange,
  };

  return { handlers, unload };
};

const getStateChangeHandler =
  (store: PlayerStore): EventHandlers["onStateChange"] =>
  ({ data, target: instance }) => {
    const { dispatch } = store,
      state = store.getState();
    if (state.player.type !== PlayerType.youtubeAPI) {
      throw new Error("Unexpected player type, expecting: youtubeAPI");
    }
    const loop = selectLoop(state),
      autoplay = selectAutoplay(state),
      paused = selectPaused(state),
      muted = selectMuted(state),
      seeking = selectSeeking(state),
      duration = selectDuration(state),
      hasStarted = selectHasStarted(state),
      customControls = selectIsCustomControls(state),
      seeked =
        seeking &&
        [YT.PlayerState.PLAYING, YT.PlayerState.PAUSED].includes(data);

    if (seeked) {
      // Unset seeking and fire seeked event
      dispatch(handleSeeked());
    }

    dispatch(handleStateChange(data));
    switch (data) {
      case YT.PlayerState.UNSTARTED:
        setTimeout(() => {
          const state = store.getState();
          if (
            state.player.type === PlayerType.youtubeAPI &&
            state.player.status.YTPlayerState === YT.PlayerState.UNSTARTED
          ) {
            dispatch(handleTimeUpdate(0));
          }
        }, 1e3);
        updateBufferYtb(instance, dispatch, duration);
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
  };

export default getYoutubeEventHandlers;
