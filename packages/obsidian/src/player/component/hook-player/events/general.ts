import {
  onPlay as restrictTimeOnPlay,
  onTimeUpdate as restrictTimeOnTimeUpdate,
} from "@base/fragment";
import { Media } from "@player/utils/media";
import {
  handlePause,
  handlePlaying,
  handleRateChange,
  handleVolumeChange,
} from "@slice/controlled";
import {
  handleDurationChange,
  handleEnded,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleWaiting,
} from "@slice/status";
import { getSubscribeFunc, PlayerStore, selectFrag, selectLoop } from "@store";

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
