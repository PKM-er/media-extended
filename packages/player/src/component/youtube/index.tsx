import { PlayerContext } from "@context";
import { getYoutubeEventHandlers } from "@hook-player/events";
import { onStartYtb } from "@hook-player/on-start";
import { hookYoutubeState } from "@hook-player/subc-state";
import { useAppSelector, usePlayerStore } from "@store-hooks";
import { CoreEventHandler } from "@utils";
import { useWillUnmount } from "@utils/hooks";
import { YoutubeMedia } from "@utils/media";
import { useUpdateEffect } from "ahooks";
import { PlayerType } from "mx-store";
import { PlayerStore } from "mx-store";
import { useContext, useMemo, useRef } from "react";
import React from "react";
import { useCallback } from "react";

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
  const store = usePlayerStore();
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
  const store = usePlayerStore();

  const { actions } = useContext(PlayerContext);
  const ready = useAppSelector(
    (state) => state.youtube.playerStatus === "ready",
  );
  useUpdateEffect(() => {
    if (!ready) return;
    const media = new YoutubeMedia(ref.current!);
    onStartYtb(media, store);
    return hookYoutubeState(media, store, actions);
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
