import { useAppSelector } from "@player/hooks";
import { useLatest, useUpdateLayoutEffect } from "ahooks";

import { PlayerRef } from "./utils";

export const useEvent = <E extends keyof YT.Events>(
  eventName: E,
  listener: YT.Events[E],
  playerRef: PlayerRef,
) => {
  const listenerRef = useLatest([eventName, listener] as const);

  const playerReady = useAppSelector(
    (state) => state.youtube.playerStatus === "ready",
  );
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

export type YoutubePlayerEvents = YT.Events & {
  onTimeUpdate?: YT.PlayerEventHandler<YT.PlayerEvent>;
  onProgress?: YT.PlayerEventHandler<YT.PlayerEvent>;
};

export type EventHandlers = Required<YoutubePlayerEvents>;
