import "js-video-url-parser/lib/provider/youtube";

import urlParser from "js-video-url-parser/lib/base";
import { useRef } from "react";
import React from "react";

import { useAppSelector } from "../../app/hooks";
import { handleSeeking, handleTimeUpdate } from "../../slice/controls";
import { useApplyTimeFragment, useTimeFragmentEvents } from "../hooks/fragment";
import {
  useApplyPlaybackRate,
  useApplyVolume,
  useStateEventHanlders,
} from "../hooks/media-props";
import { useApplyUserSeek } from "../hooks/user-seek";
import { YoutubeMedia } from "../utils/media-warpper";
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
    if (state.provider.from !== "youtube") return null;
    return urlParser.parse(state.provider.sources[0].src)?.id;
  });

  const ref: PlayerRef = useRef(null);

  const props = {
    ref,
    ...useEvents(),
  };
  useActions(ref);

  return videoId ? <YoutubeBase videoId={videoId} {...props} /> : null;
};
export default YoutubePlayer;
