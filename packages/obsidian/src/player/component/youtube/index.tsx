import { getYoutubeEventHandlers } from "@hook-player/events";
import { hookYoutubeState } from "@hook-player/subc-state";
import { useWillUnmount } from "@hook-utils";
import { useAppSelector } from "@player/hooks";
import { CoreEventHandler } from "@player/utils";
import { YoutubeMedia } from "@player/utils/media";
import { useUpdateEffect } from "ahooks";
import { PlayerType } from "mx-store";
import { PlayerStore } from "mx-store";
import { useMemo, useRef } from "react";
import React from "react";
import { useCallback } from "react";
import { useStore } from "react-redux";

import { onStartYtb } from "../hook-player/on-start";
import YoutubeBase from "./base";
import { YoutubePlayerEvents } from "./event";
import { PlayerRef } from "./utils";

const useEventHandler = (handler: CoreEventHandler<YoutubeMedia>) =>
  useCallback(
    ({ target }: YT.PlayerEvent) => handler(new YoutubeMedia(target)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

const useEvents = (): YoutubePlayerEvents => {
  const store = useStore() as PlayerStore;
  const {
    handlers: { ratechange, timeupdate, progress, error, onStateChange },
    unload,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  } = useMemo(() => getYoutubeEventHandlers(store), []);

  useWillUnmount(unload);

  return {
    onError: error,
    onPlaybackRateChange: useEventHandler(ratechange),
    onProgress: useEventHandler(progress),
    onStateChange,
    onTimeUpdate: useEventHandler(timeupdate),
  };
};

const useActions = (ref: PlayerRef) => {
  const store = useStore() as PlayerStore;

  const ready = useAppSelector(
    (state) => state.youtube.playerStatus === "ready",
  );
  useUpdateEffect(() => {
    if (!ready) return;
    const media = new YoutubeMedia(ref.current!);
    onStartYtb(media, store);
    return hookYoutubeState(media, store);
  }, [ready]);
};

const YoutubePlayer = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const videoId = useAppSelector((state) => {
    const source = state.source;
    if (source.type !== PlayerType.youtubeAPI) return null;
    return source.id;
  });

  const ref: PlayerRef = useRef(null);

  const props = {
    ref,
    style,
    className,
    ...useEvents(),
  };
  useActions(ref);

  return videoId ? <YoutubeBase videoId={videoId} {...props} /> : null;
};
export default YoutubePlayer;
