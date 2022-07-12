import { PlayerContext } from "@context";
import { getYoutubeEventHandlers } from "@hook-player/events";
import { onStartYtb } from "@hook-player/on-start";
import { hookYoutubeState } from "@hook-player/subc-state";
import { useAppDispatch, useAppSelector, usePlayerStore } from "@store-hooks";
import { CoreEventHandler } from "@utils";
import { useWillUnmount } from "@utils/hooks";
import { YoutubeMedia } from "@utils/media";
import { useMemoizedFn, useUpdateEffect } from "ahooks";
import {
  handlePlayerReady,
  PlayerType,
  selectUserSeeking,
  selectYoutubeProps,
} from "mx-store";
import Youtube, { YoutubePlayerEvents } from "mx-youtube";
import { useContext, useMemo, useRef, useState } from "react";
import React from "react";
import { useCallback } from "react";

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

const useActions = (ready: boolean, ref: PlayerRef) => {
  const store = usePlayerStore();

  const { actions } = useContext(PlayerContext);

  useUpdateEffect(() => {
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
  const videoId = useAppSelector(({ player }) => {
    if (player.type !== PlayerType.youtubeAPI) return null;
    return player.source.id;
  });

  const ref: PlayerRef = useRef(null);

  const props = {
    ref,
    style,
    className,
    ...useEvents(),
    ...useAppSelector(selectYoutubeProps),
    seeking: useAppSelector(selectUserSeeking),
  };

  const [playerReady, setPlayerReady] = useState(false);
  useActions(playerReady, ref);

  const dispatch = useAppDispatch();
  const handleReady = useMemoizedFn<YT.PlayerEventHandler<YT.PlayerEvent>>(
    ({ target: player }) => {
      setPlayerReady(true);
      dispatch(
        handlePlayerReady({
          availableSpeeds: player.getAvailablePlaybackRates(),
          duration: player.getDuration(),
        }),
      );
    },
  );

  return videoId ? (
    <Youtube videoId={videoId} {...props} onReady={handleReady} />
  ) : null;
};
export default YoutubePlayer;
