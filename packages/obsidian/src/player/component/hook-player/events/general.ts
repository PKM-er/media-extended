import {
  onPlay as restrictTimeOnPlay,
  onTimeUpdate as restrictTimeOnTimeUpdate,
} from "@base/fragment";
import { getSubscribeFunc, PlayerStore } from "@player/store";
import { Media } from "@player/utils/media";
import {
  handleDurationChange,
  handleEnded,
  handlePause,
  handlePlaying,
  handleRateChange,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleVolumeChange,
  handleWaiting,
} from "@slice/controls";
import { selectFrag, selectLoop } from "@slice/provider";

const generalEventHandlers = <M extends Media>(store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store),
    { dispatch } = store;

  let frag: [number, number] | null, loop: boolean;
  const toUnload = [
    subscribe(selectFrag, (newFrag) => (frag = newFrag)),
    subscribe(selectLoop, (newLoop) => (loop = newLoop)),
  ];
  const handlers = {
    ratechange: (media: M) => dispatch(handleRateChange(media.playbackRate)),
    play: (media: M) => {
      dispatch(handlePlaying());
      restrictTimeOnPlay(frag, media);
    },
    pause: () => dispatch(handlePause()),
    timeupdate: (media: M) => {
      dispatch(handleTimeUpdate(media.currentTime));
      restrictTimeOnTimeUpdate(frag, media, loop);
    },
    volumechange: (media: M) =>
      dispatch(
        handleVolumeChange({ volume: media.volume, muted: media.muted }),
      ),
    durationchange: (media: M) =>
      dispatch(handleDurationChange(media.duration)),
    seeked: () => dispatch(handleSeeked()),
    seeking: () => dispatch(handleSeeking()),
    waiting: () => dispatch(handleWaiting()),
    ended: () => dispatch(handleEnded()),
  };
  return { handlers, unload: () => toUnload.forEach((unload) => unload()) };
};

export default generalEventHandlers;
