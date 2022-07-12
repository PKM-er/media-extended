import { useInterval, useLatest, useUpdateLayoutEffect } from "ahooks";
import { useState } from "react";

import { PlayerRef, YoutubePlayerProps } from "./common";

export const useEvent = <E extends keyof YT.Events>(
  eventName: E,
  listener: YT.Events[E],
  playerRef: PlayerRef,
  { current: playerReady }: React.MutableRefObject<boolean>,
) => {
  const listenerRef = useLatest([eventName, listener] as const);

  // use layout effect to ensure that the remove listener is called before unmount
  useUpdateLayoutEffect(() => {
    let player: YT.Player | null = null;
    const [eventName, listener] = listenerRef.current;
    if (playerReady) {
      if (playerRef.current?.addEventListener) {
        player = playerRef.current;
        player.addEventListener(eventName, listener as any);
      }
    }
    return () => {
      if (player?.removeEventListener) {
        player.removeEventListener(eventName, listener as any);
      }
      player = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady]);
};

export const useTimeUpdateEvent = (
  { onTimeUpdate, seeking, timeupdateFreq = 100 }: YoutubePlayerProps,
  playerRef: PlayerRef,
  PlayerReadyRef: React.MutableRefObject<boolean>,
) => {
  const playerReady = PlayerReadyRef.current;

  // const seeking = useAppSelector((state) => selectUserSeek(state) !== null);
  const [playing, setPlaying] = useState(false);

  const interval =
    onTimeUpdate && playerReady && !seeking && playing
      ? timeupdateFreq
      : undefined;
  useInterval(() => {
    if (playerRef.current) onTimeUpdate!({ target: playerRef.current });
  }, interval);

  // register to state change event to track playing state
  useEvent(
    "onStateChange",
    ({ data }) => {
      setPlaying(data === YT.PlayerState.PLAYING);
    },
    playerRef,
    PlayerReadyRef,
  );
};

export const useProgressEvent = (
  { onProgress, progressFreq = 200 }: YoutubePlayerProps,
  playerRef: PlayerRef,
  { current: playerReady }: React.MutableRefObject<boolean>,
) => {
  const [lastBuffered, setLastBuffered] = useState<number | null>(null);

  const interval =
    onProgress && playerReady && lastBuffered !== 1 // Bail if we're at 100%
      ? progressFreq
      : undefined;

  useInterval(() => {
    if (!playerRef.current) return;
    const instance = playerRef.current;
    // Get loaded % from YouTube
    const buffered = instance.getVideoLoadedFraction();
    // Trigger progress only when we actually buffer something
    if (lastBuffered === null || lastBuffered < buffered) {
      onProgress!({
        target: instance,
      });
    }
    // Set last buffer point
    setLastBuffered(buffered);
  }, interval);
};
