import { getSubscribeFunc, PlayerStore } from "@player/store";
import { YoutubeMedia } from "@player/utils/media";
import { gotTimestamp } from "@slice/action/thunk";
import {
  handleSeeking,
  handleTimeUpdate,
  handleVolumeChange,
  unlockPlayPauseEvent,
} from "@slice/controls";
import { setVolumeByOffestDone } from "@slice/youtube";

import { selectDuration, updateBufferYtb } from "../common";
import { respondTimestampReq } from "../timestamp";
import hookState from "./general";

export const hookYoutubeState = (media: YoutubeMedia, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store),
    { dispatch } = store;

  let duration: number | null;
  const toUnload: (() => void)[] = [
    subscribe(selectDuration, (newDuration) => (duration = newDuration)),
    hookState(media, store),
    // useApplyUserSeek
    subscribe(
      (state) => state.controls.userSeek,
      (seek, prevSeek) => {
        let currentTime = -1;
        if (seek) {
          currentTime = seek.currentTime;
        } else if (prevSeek) {
          // seek ends
          currentTime = prevSeek.currentTime;
        }
        if (currentTime >= 0) {
          dispatch(handleSeeking());
          dispatch(handleTimeUpdate(currentTime));
        }
      },
    ),
    // useApplyPaused
    subscribe(
      (state) => state.controls.paused,
      (paused) => {
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
        setTimeout(() => {
          store.dispatch(unlockPlayPauseEvent());
        }, 50);
      },
    ),
    // useUpdateSeekState
    subscribe(
      (state) => state.provider,
      () => updateBufferYtb(media.instance, dispatch, duration),
    ),
    respondTimestampReq(
      media,
      store,
      (...args) => dispatch(gotTimestamp(...args)),
      () => duration,
    ),
    // useSetVolumeByOffset
    subscribe(
      (state) => state.youtube.volumeOffest,
      (now, prev) => {
        if (!(prev == null && now !== null) || !media.instance) return;
        const payload = {
          volume: (media.instance.getVolume() + now) / 100,
          muted: media.instance.isMuted(),
        };
        dispatch(handleVolumeChange(payload));
        dispatch(setVolumeByOffestDone());
      },
      false,
    ),
  ];

  return () => toUnload.forEach((unload) => unload());
};
