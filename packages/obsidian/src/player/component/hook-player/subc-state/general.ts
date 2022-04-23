import { onFragUpdate } from "@base/fragment";
import { getSubscribeFunc, PlayerStore } from "@player/store";
import { Media } from "@player/utils/media";

import { selectFrag, selectVolumeMute } from "../common";

const hookState = (media: Media, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store);

  const toUnload: (() => void)[] = [
    // useApplyTimeFragment
    subscribe(selectFrag, (newFrag) => onFragUpdate(newFrag, media)),
    // useApplyPlaybackRate
    subscribe(
      (state) => state.controls.playbackRate,
      (rate) => {
        media.playbackRate !== rate && (media.playbackRate = rate);
      },
    ),
    // useApplyVolume
    subscribe(selectVolumeMute, ([muted, volume]) => {
      media.volume !== volume && (media.volume = volume);
      media.muted !== muted && (media.muted = muted);
    }),
    // useApplyUserSeek
    subscribe(
      (state) => state.controls.userSeek,
      (seek, prevSeek) => {
        let params:
          | [time: number, options: { allowSeekAhead: boolean }]
          | null = null;
        // https://developers.google.com/youtube/iframe_api_reference#seekTo
        if (seek) {
          params = [seek.currentTime, { allowSeekAhead: false }];
        } else if (prevSeek) {
          // seek ends
          params = [prevSeek.currentTime, { allowSeekAhead: true }];
        }
        if (params) {
          media.seekTo(...params);
        }
      },
    ),
  ];

  return () => toUnload.forEach((unload) => unload());
};
export default hookState;
