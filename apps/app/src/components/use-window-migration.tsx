import type { MediaPlayerInstance } from "@vidstack/react";
import { useEffect } from "react";
import { useMediaViewStore } from "./context";

export interface LastState {
  win: Window | undefined;
  currentTime: number;
  playbackRate: number;
  paused: boolean;
}

// restore state during window migration
export function useHandleWindowMigration(
  playerRef: React.RefObject<MediaPlayerInstance>,
) {
  const lastStateRef = useMediaViewStore((s) => s.lastStateRef);
  useEffect(
    () =>
      playerRef.current?.subscribe(({ currentTime, paused, playbackRate }) => {
        if (currentTime === 0) return;
        lastStateRef.current = {
          win: playerRef.current?.el?.win,
          currentTime,
          paused,
          playbackRate,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerRef.current],
  );
  useEffect(
    () =>
      playerRef.current?.listen("can-play", (evt) => {
        if (
          !lastStateRef.current ||
          lastStateRef.current?.win === evt.target.el?.win
        )
          return;
        const { currentTime, paused, playbackRate } = lastStateRef.current;
        const player = evt.target;
        player.currentTime = currentTime;
        player.playbackRate = playbackRate;
        if (!paused) player.play(new Event("recover-state"));
        lastStateRef.current = null;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerRef.current],
  );
  useEffect(
    () =>
      playerRef.current?.listen("source-change", (evt) => {
        // if during window migration, don't reset state
        if (lastStateRef.current?.win !== evt.target.el?.win) return;
        lastStateRef.current = null;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerRef.current],
  );
}
