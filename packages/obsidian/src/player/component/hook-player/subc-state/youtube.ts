import { gotTimestamp } from "@player/thunk/action";
import { YoutubeMedia } from "@player/utils/media";
import { handleVolumeChange } from "mx-store";
import { handleSeeking, handleTimeUpdate } from "mx-store";
import { setVolumeByOffestDone } from "mx-store";
import { getSubscribeFunc, PlayerStore, selectDuration } from "mx-store";

import { updateBufferYtb } from "../common";
import { respondTimestampReq } from "../timestamp";
import hookState, { getApplyPauseHandler } from "./general";

export const hookYoutubeState = (media: YoutubeMedia, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store),
    { dispatch } = store;

  let duration: number | null;
  const toUnload: (() => void)[] = [
    subscribe(selectDuration, (newDuration) => (duration = newDuration)),
    hookState(media, store),
    // useApplyUserSeek
    subscribe(
      (state) => state.userSeek,
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
    getApplyPauseHandler(store, (paused) => {
      const state = media.instance.getPlayerState();
      if (paused && state === YT.PlayerState.PLAYING)
        return () => media.pause();
      else if (
        !paused &&
        (state === YT.PlayerState.PAUSED ||
          state === YT.PlayerState.CUED ||
          state === YT.PlayerState.UNSTARTED)
      )
        return () => media.play();
      else return null;
    }),
    // useUpdateSeekState
    subscribe(
      (state) => state.source,
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
