import { PlayerStore, subscribe } from "@player/store";
import type { HTMLMedia } from "@player/utils/media";
import {
  lockCaptionUpdateEvent,
  unlockCaptionUpdateEvent,
} from "@slice/controls";

import _hookHTMLState from "./html5";

export const hookHTMLState = (media: HTMLMedia, store: PlayerStore) => {
  const toUnload = [
    _hookHTMLState(media, store),
    subscribe(
      store,
      (state) => state.controls.captions.active,
      (index) => {
        store.dispatch(lockCaptionUpdateEvent());
        for (let i = 0; i < media.instance.textTracks.length; i++) {
          const track = media.instance.textTracks[i];
          if (i === index) {
            track.mode = "showing";
          } else {
            track.mode = "disabled";
          }
        }
        setTimeout(() => {
          store.dispatch(unlockCaptionUpdateEvent());
        }, 50);
      },
    ),
  ];
  return () => toUnload.forEach((unload) => unload());
};
