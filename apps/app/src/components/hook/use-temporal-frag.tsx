import { useMediaPlayer, type MediaPlayerInstance } from "@vidstack/react";
import { useEffect } from "react";
import { isTimestamp, type TempFragment } from "@/lib/hash/temporal-frag";
import type { MediaViewStoreApi } from "../context";
import { useMediaViewStoreInst } from "../context";
import { useAutoContinuePlay } from "./use-playlist";

export function useTempFragHandler() {
  const player = useMediaPlayer();
  const store = useMediaViewStoreInst();
  const { onEnded } = useAutoContinuePlay();

  useEffect(() => {
    if (!player) return;
    return handleTempFrag(player, store, onEnded);
  }, [player, store, onEnded]);
}

function handleTempFrag(
  player: MediaPlayerInstance,
  store: MediaViewStoreApi,
  onEnd?: (() => void) | undefined,
) {
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
        if (currentTime > end && !loop) {
          onEnd?.();
        }
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
          if (loop) {
            player.currentTime = start;
            // continue to play in loop
            // if temporal fragment (#t=,2 at the end of src) paused the media
            if (paused) player.play();
          } else {
            onEnd?.();
            if (seekingLock) {
              seekingLock = false;
              return;
            }
            if (!paused) player.pause();
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
