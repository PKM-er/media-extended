import { useAppSelector } from "@player/hooks";
import { YoutubeMedia } from "@player/utils/media";
import { handleSeeking, handleTimeUpdate } from "@slice/controls";
import { useRef } from "react";
import React from "react";

import { useApplyTimeFragment, useTimeFragmentEvents } from "../hooks/fragment";
import useGetTimestamp from "../hooks/get-timestamp";
import {
  useApplyPlaybackRate,
  useApplyVolume,
  useStateEventHanlders,
} from "../hooks/media-props";
import { useApplyUserSeek } from "../hooks/user-seek";
import YoutubeBase from "./base";
import { useEventHandler, YoutubePlayerEvents } from "./event";
import {
  useApplyPaused,
  useError,
  useProgress,
  useStateChangeHandler,
  useUpdateSeekState,
} from "./media-props";
import { PlayerRef, useSubscribe } from "./utils";

const useEvents = (): YoutubePlayerEvents => {
  const { onPlay: restrictTimeOnPlay, onTimeUpdate: restrictTimeOnTimeUpdate } =
      useTimeFragmentEvents(),
    { onProgress } = useProgress(),
    { onStateChange } = useStateChangeHandler(),
    { onRateChange, onTimeUpdate: setCurrentTimeState } =
      useStateEventHanlders(),
    { onError } = useError();

  return {
    onError,
    onPlaybackRateChange: useEventHandler(onRateChange),
    onProgress,
    onStateChange: (evt) => {
      const media = new YoutubeMedia(evt.target);
      onStateChange(evt);
      if (evt.data === YT.PlayerState.PLAYING) {
        restrictTimeOnPlay(media);
      }
    },
    onTimeUpdate: useEventHandler(
      setCurrentTimeState,
      restrictTimeOnTimeUpdate,
    ),
  };
};

const useActions = (ref: PlayerRef) => {
  useApplyTimeFragment(useSubscribe, ref);
  useApplyUserSeek(useSubscribe, ref, (dispatch, curr) => {
    dispatch(handleSeeking());
    dispatch(handleTimeUpdate(curr));
  });
  useApplyVolume(useSubscribe, ref);
  useUpdateSeekState(ref);
  useApplyPaused(ref);
  useApplyPlaybackRate(useSubscribe, ref);
};

const YoutubePlayer = () => {
  const videoId = useAppSelector((state) => {
    const source = state.provider.source;
    if (source?.playerType !== "youtube") return null;
    return source.id;
  });

  const ref: PlayerRef = useRef(null);

  const props = {
    ref,
    ...useEvents(),
  };
  useActions(ref);
  useGetTimestamp(ref, useSubscribe);

  return videoId ? <YoutubeBase videoId={videoId} {...props} /> : null;
};
export default YoutubePlayer;
