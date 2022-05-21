import { HTMLMedia } from "@utils/media";
import { PlayerType } from "mx-store";
import { getSubscribeFunc, PlayerStore } from "mx-store";

import { selectShouldLoadResource } from "../common";
import hookState, { getApplyPauseHandler } from "./general";

const hookHTMLState = (media: HTMLMedia, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store);

  const shouldLoadSource = [
    PlayerType.video,
    PlayerType.audio,
    PlayerType.unknown,
  ];

  const toUnload: (() => void)[] = [
    hookState(media, store),
    // useLoadSources
    subscribe(
      selectShouldLoadResource,
      ([type, src], prev) => {
        if (
          shouldLoadSource.includes(type as any) &&
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
      (state) => state.userSeek,
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
