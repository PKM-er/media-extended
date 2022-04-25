import { PlayerStore, subscribe } from "@player/store";
import type { HTMLMedia } from "@player/utils/media";
import {
  lockTracksUpdateEvent,
  unlockTracksUpdateEvent,
} from "@slice/interface";

import _hookHTMLState from "./html5";

export const hookHTMLState = (media: HTMLMedia, store: PlayerStore) => {
  const toUnload = [
    _hookHTMLState(media, store),
    subscribe(
      store,
      (state) => {
        const { active, enabled } = state.interface.textTracks,
          controls = state.interface.controls;
        return [active, enabled, controls] as const;
      },
      ([active, enabled, controls]) => {
        store.dispatch(lockTracksUpdateEvent());
        for (let i = 0; i < media.instance.textTracks.length; i++) {
          const track = media.instance.textTracks[i];
          if (enabled && i === active) {
            track.mode = controls === "custom" ? "hidden" : "showing";
          } else {
            track.mode = "disabled";
          }
        }
        setTimeout(() => {
          store.dispatch(unlockTracksUpdateEvent());
        }, 50);
      },
      false,
    ),
  ];
  return () => toUnload.forEach((unload) => unload());
};
