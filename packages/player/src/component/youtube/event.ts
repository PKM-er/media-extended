import { useLatest } from "ahooks";
import { useLayoutEffect } from "react";

import { useAppSelector } from "../../app/hooks";
import {
  CoreEventHandler,
  useEventHandler as useEventHandler0,
} from "../utils";
import { YoutubeMedia } from "../utils/media-warpper";
import { PlayerRef } from "./utils";

type EventHandler = CoreEventHandler<YoutubeMedia>;
type NativeEvent = YT.PlayerEvent;
const toYoutubeMedia = ({ target }: NativeEvent) => new YoutubeMedia(target);
export const useEventHandler = (...handler: EventHandler[]) =>
  useEventHandler0(handler, toYoutubeMedia);

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
  useLayoutEffect(() => {
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
  }, [playerReady, listenerRef, playerRef]);
};

export type YoutubePlayerEvents = YT.Events & {
  onTimeUpdate?: YT.PlayerEventHandler<YT.PlayerEvent>;
  onProgress?: YT.PlayerEventHandler<YT.PlayerEvent>;
};

export type EventHandlers = Required<YoutubePlayerEvents>;
