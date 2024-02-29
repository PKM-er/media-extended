import { useMediaPlayer, type MediaPlayerInstance } from "@vidstack/react";
import { useEffect } from "react";
import { isTimestamp, type TempFragment } from "@/lib/hash/temporal-frag";
import { isWebpageUrl } from "@/lib/remote-player/encode";
import type { MediaViewStoreApi } from "../context";
import { useMediaViewStoreInst } from "../context";

export function useTempFragHandler() {
  const player = useMediaPlayer();
  const store = useMediaViewStoreInst();
  useEffect(() => {
    if (!player) return;
    return handleTempFrag(player, store);
  }, [player, store]);
}

function handleTempFrag(player: MediaPlayerInstance, store: MediaViewStoreApi) {
  if (
    localStorage.getItem("MX_DEV_DISABLE_WEBVIEW_TEMP_FRAG") === "1" &&
    isWebpageUrl(player.state.source.src)
  ) {
    console.log("DEV: temporal fragment handling in webpage disabled");
    return;
  }
  const prev = {
    currentTime: player.state.currentTime,
    paused: player.state.paused,
    loop: player.state.loop,
  };
  let seekingLock = false;
  const unloads = [
    player.subscribe(({ currentTime, paused, loop }) => {
      const frag = limitRange(
        store.getState().hash.tempFragment,
        player.state.duration,
      );
      if (!frag || isTimestamp(frag)) return;
      const { start, end } = frag;
      // onPlay
      if (prev.paused !== paused && !paused) {
        if (currentTime > end || currentTime < start) {
          // solve issue where player.currentTime is not updated in time
          // and timeupdate event is fired with old currentTime
          // for async state updates in remote player
          // causing player to try to pause in case of loop=false and currentTime > end
          seekingLock = true;
          player.currentTime = start;
        }
      }
      // onTimeUpdate
      else if (prev.currentTime !== currentTime) {
        if (currentTime < start) {
          player.currentTime = start;
        } else if (currentTime > end) {
          if (!loop) {
            if (seekingLock) {
              seekingLock = false;
              return;
            }
            if (!paused) player.pause();
          } else {
            player.currentTime = start;
            // continue to play in loop
            // if temporal fragment (#t=,2 at the end of src) paused the media
            if (paused) player.play();
          }
        }
      }
      Object.assign(prev, { currentTime, paused, loop });
    }),
  ];
  return () => unloads.forEach((u) => u());
}

function limitRange(
  frag: TempFragment | null,
  duration: number | null,
): TempFragment | null {
  if (!frag) return null;
  // if only start is set, treat it as timestamp
  if (isTimestamp(frag)) return frag;
  const { start, end } = frag;
  if (duration && duration < start) return null;
  return {
    start: start < 0 ? 0 : start,
    end: end < 0 ? Infinity : end,
  };
}
