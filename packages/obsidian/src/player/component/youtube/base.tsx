import config from "@player/config";
import { useAppDispatch } from "@player/hooks";
import { useAppSelector } from "@player/hooks";
import { useWillUnmount } from "@player/utils/hooks";
import { handleVolumeChange } from "@slice/controls";
import { setRatio } from "@slice/interface";
import {
  destroyPlayer,
  initializePlayer,
  resetPlayer,
  setVolumeByOffestDone,
} from "@slice/youtube";
import { useInterval, useUpdateEffect } from "ahooks";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import { useEvent, YoutubePlayerEvents } from "./event";
import { PlayerRef, useSubscribe } from "./utils";

type YoutubePlayerProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  "ref" | keyof YoutubePlayerEvents
> &
  Omit<YoutubePlayerEvents, "onReady"> & {
    videoId: string;
  };

const useUpdateVideoId = (
  newId: string,
  playerRef: React.MutableRefObject<YT.Player | null>,
) => {
  useUpdateEffect(() => {
    if (!playerRef.current) {
      console.error("no player instance available when updating video");
      return;
    }
    playerRef.current.cueVideoById(newId);
  }, [newId]);
};

/**
 * reset player when props that cannot be set on-the-fly changes
 */
const useResetToApplyProps = (
  containerRef: ((instance: HTMLElement | null) => void) &
    React.MutableRefObject<HTMLElement | null>,
  playerRef: React.MutableRefObject<YT.Player | null>,
  videoId: string,
) => {
  useSubscribe(
    (state) => [state.controls.autoplay, state.interface.controls === "native"],
    ([, prev], dispatch) => {
      if (prev && containerRef.current) {
        dispatch(resetPlayer(playerRef, containerRef.current, videoId));
      }
    },
    { immediate: false, ref: playerRef },
  );
};
const useSetVolumeByOffset = (
  ref: React.MutableRefObject<YT.Player | null>,
) => {
  useSubscribe(
    (state) => state.youtube.volumeOffest,
    ([now, prev], dispatch) => {
      if (!(prev == null && now !== null) || !ref.current) return;
      const payload = {
        volume: (ref.current.getVolume() + now) / 100,
        muted: ref.current.isMuted(),
      };
      dispatch(handleVolumeChange(payload));
      dispatch(setVolumeByOffestDone());
    },
    { immediate: false, ref },
  );
};

const YoutubePlayer = React.forwardRef<YT.Player | null, YoutubePlayerProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function YoutubePlayer(p: YoutubePlayerProps, forwardRef) {
    const {
      onStateChange,
      onPlaybackQualityChange,
      onPlaybackRateChange,
      onError,
      onApiChange,
      onTimeUpdate,
      onProgress,
      videoId,
      ...containerProps
    } = p;

    const internalRef: PlayerRef = useRef(null),
      playerRef = useMergeRefs([forwardRef, internalRef]);

    const dispatch = useAppDispatch();
    const containerRef = useRefEffect((node: HTMLElement) => {
      dispatch(initializePlayer([playerRef, node, videoId]));
    }, []); // not include videoId in deps, since it will update on-the-fly

    useResetToApplyProps(containerRef, playerRef, videoId);
    useUpdateVideoId(videoId, playerRef);
    useSetVolumeByOffset(playerRef);

    useEvent("onStateChange", onStateChange, playerRef);
    useEvent("onPlaybackQualityChange", onPlaybackQualityChange, playerRef);
    useEvent("onPlaybackRateChange", onPlaybackRateChange, playerRef);
    useEvent("onError", onError, playerRef);
    useEvent("onApiChange", onApiChange, playerRef);
    useTimeUpdateEvent(playerRef, onTimeUpdate);
    useProgressEvent(playerRef, onProgress);

    useWillUnmount(() => dispatch(destroyPlayer(playerRef)));

    return (
      <div
        className="mx__youtube-player"
        ref={containerRef}
        {...containerProps}
      />
    );
  },
);

const useTimeUpdateEvent = (
  playerRef: PlayerRef,
  onTimeUpdate: YoutubePlayerEvents["onTimeUpdate"] | undefined,
) => {
  const playerReady = useAppSelector(
    (state) => state.youtube.playerStatus === "ready",
  );
  const [playing, setPlaying] = useState(false);

  const interval =
    onTimeUpdate && playerReady && playing
      ? config.youtube.timeupdate_freq
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
  );
};

const useProgressEvent = (
  playerRef: PlayerRef,
  onProgress: YoutubePlayerEvents["onProgress"] | undefined,
) => {
  const playerReady = useAppSelector(
    (state) => state.youtube.playerStatus === "ready",
  );
  const [lastBuffered, setLastBuffered] = useState<number | null>(null);

  const interval =
    onProgress && playerReady && lastBuffered !== 1 // Bail if we're at 100%
      ? config.youtube.progress_freq
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

export default YoutubePlayer;
