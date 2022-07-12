import { useUnmount, useUpdateEffect } from "ahooks";
import equal from "fast-deep-equal/es6";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import {
  BasicOptions,
  getResetProps,
  PlayerRef,
  propsToPlayerVars,
  YoutubePlayerProps,
} from "./common";
import { useEvent, useProgressEvent, useTimeUpdateEvent } from "./event";
import { IFrameAPIStatus, loadAPI } from "./load-api";

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

const loadPlayer = (
  props: YoutubePlayerProps,
  container: HTMLElement,
  PlayerReadyRef: React.MutableRefObject<boolean>,
): YT.Player => {
  const { onReady, videoId } = props;
  const elToLoadPlayer = document.createElement("div");
  container.replaceChildren(elToLoadPlayer);
  const player = new YT.Player(elToLoadPlayer, {
    ...BasicOptions,
    videoId,
    playerVars: {
      ...BasicOptions.playerVars,
      ...propsToPlayerVars(props),
    },
    events: {
      onReady: (evt) => {
        // Bail if onReady has already been called.
        // See https://github.com/sampotts/plyr/issues/1108
        if (PlayerReadyRef.current) return;
        PlayerReadyRef.current = true;
        onReady?.(evt);
      },
    },
  });
  let iframe;
  // Set the tabindex to avoid focus entering iframe
  if (!props.controls && (iframe = player.getIframe())) {
    iframe.tabIndex = -1;
  }
  return player;
};

type Props = YoutubePlayerProps & React.HTMLAttributes<HTMLDivElement>;

const YoutubePlayer = React.forwardRef<YT.Player | null, Props>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function YoutubePlayer(props: Props, forwardRef) {
    const {
      onStateChange,
      onPlaybackQualityChange,
      onPlaybackRateChange,
      onError,
      onApiChange,
      onReady,
      videoId,
      autoplay,
      controls,
      language,
      loop,
      mute,
      seeking,
      onProgress,
      onTimeUpdate,
      progressFreq,
      timeupdateFreq,
      ...divProps
    } = props;

    const internalRef: PlayerRef = useRef(null),
      playerRef = useMergeRefs([forwardRef, internalRef]);

    const [APIStatus, setAPIStatus] = useState(IFrameAPIStatus.NOT_LOADED);
    const PlayerReadyRef = useRef(false);

    useEffect(() => {
      setAPIStatus(IFrameAPIStatus.LOADING);
      loadAPI()
        .then((api) => {
          setAPIStatus(IFrameAPIStatus.READY);
        })
        .catch(() => setAPIStatus(IFrameAPIStatus.ERROR));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const prevResetPropsRef = useRef(getResetProps(props));
    const containerRef = useRefEffect(
      (container: HTMLElement) => {
        let player: YT.Player | undefined;
        if (
          container &&
          APIStatus === IFrameAPIStatus.READY &&
          // update player if player not init or reset props changed
          (!PlayerReadyRef.current ||
            !equal(prevResetPropsRef.current, getResetProps(props)))
        ) {
          playerRef.current?.destroy();
          PlayerReadyRef.current = false;
          player = loadPlayer(props, container, PlayerReadyRef);
          playerRef.current = player;
        }
        prevResetPropsRef.current = getResetProps(props);
      },
      [APIStatus, ...getResetProps(props)],
    ); // not include videoId in deps, since it will update on-the-fly
    useUnmount(() => {
      playerRef.current?.destroy();
      playerRef.current = null;
      PlayerReadyRef.current = false;
    });

    useUpdateVideoId(videoId, playerRef);

    const refs = [playerRef, PlayerReadyRef] as const;
    useEvent("onStateChange", onStateChange, ...refs);
    useEvent("onPlaybackQualityChange", onPlaybackQualityChange, ...refs);
    useEvent("onPlaybackRateChange", onPlaybackRateChange, ...refs);
    useEvent("onError", onError, ...refs);
    useEvent("onApiChange", onApiChange, ...refs);
    useTimeUpdateEvent(props, ...refs);
    useProgressEvent(props, ...refs);

    return (
      <div className="mx__youtube-player" ref={containerRef} {...divProps} />
    );
  },
);

export default YoutubePlayer;

export type { EventHandlers, YoutubePlayerEvents } from "./common";
