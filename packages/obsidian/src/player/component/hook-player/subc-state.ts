import { onFragUpdate } from "@base/fragment";
import {
  AppDispatch,
  AppThunk,
  getSubscribeFunc,
  PlayerStore,
} from "@player/store";
import { HTMLMedia, Media } from "@player/utils/media";
import { selectIsIOS } from "@slice/action";
import {
  cancelScreenshot,
  gotScreenshot,
  gotTimestamp,
  selectScreenshotRequested,
  selectTimestampRequested,
} from "@slice/action/thunk";
import { captureScreenshot } from "mx-lib";

import {
  selectFrag,
  selectShouldLoadResource,
  selectVolumeMute,
} from "./common";

const hookState = (player: HTMLMediaElement, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store),
    dispatch = (action: Parameters<AppDispatch>[0]) => store.dispatch(action);

  const media = new HTMLMedia(player) as Media<"html5">;

  const shouldLoadSource = ["audio", "video", "unknown"] as const;

  const unsubscribe: (() => void)[] = [
    // useApplyTimeFragment
    subscribe(selectFrag, (newFrag) => onFragUpdate(newFrag, media), true),
    // useApplyPlaybackRate
    subscribe(
      (state) => state.controls.playbackRate,
      (rate) => {
        media.playbackRate === rate && (media.playbackRate = rate);
      },
      true,
    ),
    // useApplyVolume
    subscribe(
      selectVolumeMute,
      ([muted, volume]) => {
        media.volume !== volume && (media.volume = volume);
        media.muted !== muted && (media.muted = muted);
      },
      true,
    ),
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
      true,
    ),
    // useApplyPaused
    subscribe(
      (state) => state.controls.paused,
      (paused) => {
        if (media.paused === paused) return;
        media[paused ? "pause" : "play"]();
      },
      true,
    ),
    // useLoadSources
    subscribe(selectShouldLoadResource, ([playerType, src], prev) => {
      if (
        shouldLoadSource.includes(playerType as any) &&
        prev?.[1] &&
        src !== prev[1]
      ) {
        media.instance.load();
      }
    }),
  ];

  return () => {
    for (const unsub of unsubscribe) {
      unsub();
    }
  };
};

export default hookState;
