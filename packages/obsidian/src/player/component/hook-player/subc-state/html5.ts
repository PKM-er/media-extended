import { getSubscribeFunc, PlayerStore } from "@player/store";
import { HTMLMedia } from "@player/utils/media";
import { unlockPlayPauseEvent } from "@slice/controls";

import { selectShouldLoadResource } from "../common";
import hookState from "./general";

export const hookHTMLState = (media: HTMLMedia, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store);

  const shouldLoadSource = ["audio", "video", "unknown"] as const;

  const toUnload: (() => void)[] = [
    hookState(media, store),
    // useLoadSources
    subscribe(
      selectShouldLoadResource,
      ([playerType, src], prev) => {
        if (
          shouldLoadSource.includes(playerType as any) &&
          prev?.[1] &&
          src !== prev[1]
        ) {
          media.instance.load();
        }
      },
      false,
    ),
    // useApplyPaused
    subscribe(
      (state) => state.controls.paused,
      async (paused) => {
        if (media.paused === paused) return;
        await media[paused ? "pause" : "play"]();
        setTimeout(() => {
          store.dispatch(unlockPlayPauseEvent());
        }, 50);
      },
    ),
    // pause when seeking
    subscribe(
      (state) => state.controls.userSeek,
      (seek, prevSeek) => {
        if (seek && !prevSeek) {
          media.pause();
        } else if (prevSeek && !seek && !prevSeek.pausedBeforeSeek) {
          media.play();
        }
      },
    ),
  ];

  return () => toUnload.forEach((unload) => unload());
};
