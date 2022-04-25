import { getSubscribeFunc, PlayerStore } from "@player/store";
import { HTMLMedia } from "@player/utils/media";
import { lockPlayPauseEvent, unlockPlayPauseEvent } from "@slice/controls";

import { selectShouldLoadResource } from "../common";
import hookState, { getApplyPauseHandler } from "./general";

const hookHTMLState = (media: HTMLMedia, store: PlayerStore) => {
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
    getApplyPauseHandler(store, (paused) => {
      if (media.paused === paused) return null;
      else return () => media[paused ? "pause" : "play"]();
    }),
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
export default hookHTMLState;
