import { IActions } from "@context";
import { YoutubeMedia } from "@utils/media";
import {
  handleVolumeChange,
  selectMediaSource,
  selectUserSeek,
} from "mx-store";
import { handleSeeking, handleTimeUpdate } from "mx-store";
import { getSubscribeFunc, PlayerStore, selectDuration } from "mx-store";

import { updateBufferYtb } from "../common";
import { respondTimestampReq } from "../timestamp";
import hookState from "./general";

export const hookYoutubeState = (
  media: YoutubeMedia,
  store: PlayerStore,
  { gotTimestamp }: IActions,
) => {
  const subscribe = getSubscribeFunc(store),
    { dispatch } = store;

  let duration: number | null;
  const toUnload: (() => void)[] = [
    subscribe(
      selectDuration,
      (newDuration) => (duration = newDuration ?? null),
    ),
    hookState(media, store),
    // handle volume/muted change here, since youtube API doesn't support volumechange event
    store.emitter.on("setVolumeUnmute", (volume) => {
      dispatch(handleVolumeChange({ volume, muted: false }));
    }),
    store.emitter.on("setVolume", (volume) => {
      dispatch(handleVolumeChange({ volume, muted: media.muted }));
    }),
    store.emitter.on("setVolumeByOffest", (volumeOffset) => {
      handleVolumeChange({
        volume: volumeOffset / 100 + media.volume,
        muted: media.muted,
      });
    }),
    store.emitter.on("setMute", (muted) => {
      dispatch(handleVolumeChange({ muted, volume: media.volume }));
    }),
    store.emitter.on("toggleMute", () => {
      dispatch(
        handleVolumeChange({ muted: !media.muted, volume: media.volume }),
      );
    }),
    // useApplyUserSeek
    subscribe(selectUserSeek, (seek, prevSeek) => {
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
    }),
    // useUpdateSeekState
    subscribe(selectMediaSource, () =>
      updateBufferYtb(media.instance, dispatch, duration),
    ),
    respondTimestampReq(
      media,
      store,
      (...args) => gotTimestamp(store.dispatch, args),
      () => duration,
    ),
    // useSetVolumeByOffset
    store.emitter.on("setVolumeByOffest", (offset) => {
      dispatch(
        handleVolumeChange({
          volume: (media.volume + offset) / 100,
          muted: media.muted,
        }),
      );
    }),
  ];

  return () => toUnload.forEach((unload) => unload());
};
