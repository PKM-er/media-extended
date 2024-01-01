import { useMediaPlayer, type MediaPlayerInstance } from "@vidstack/react";
import { isString } from "maverick.js/std";
import { useEffect } from "react";
import {
  isTempFragEqual,
  isTimestamp,
  parseTempFrag,
  type TempFragment,
} from "../../lib/hash/temporal-frag";

export function useTempFrag() {
  const player = useMediaPlayer();
  useEffect(() => {
    if (!player) return;
    return handleTempFrag(player);
  }, [player]);
}

function handleTempFrag(player: MediaPlayerInstance) {
  let frag: TempFragment | null = null;
  const prev: { currentTime: number; paused: boolean; loop: boolean } = {
    currentTime: player.state.currentTime,
    paused: player.state.paused,
    loop: player.state.loop,
  };
  const unloads = [
    player.subscribe(({ currentTime, paused, loop }) => {
      if (!frag || isTimestamp(frag)) return;
      const { start, end } = frag;
      // onPlay
      if (prev.paused !== paused && !paused) {
        if (currentTime > end || currentTime < start) {
          player.currentTime = start;
        }
      }
      // onTimeUpdate
      else if (prev.currentTime !== currentTime) {
        if (currentTime < start) {
          player.currentTime = start;
        } else if (currentTime > end) {
          if (!loop) {
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
    player.subscribe(({ currentSrc, duration }) => {
      if (!isString(currentSrc.src)) {
        frag = null;
        return;
      }
      try {
        const url = new URL(currentSrc.src);
        const newFrag = limitRange(parseTempFrag(url.hash), duration);
        if (isTempFragEqual(newFrag, frag)) return;
        frag = newFrag;
        if (!frag) return;
        player.currentTime = frag.start;
      } catch {
        frag = null;
      }
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
