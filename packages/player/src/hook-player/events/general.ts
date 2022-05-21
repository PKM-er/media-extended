import { Media } from "mx-base";
import { Frag } from "mx-base";
import {
  handlePause,
  handlePlaying,
  handleRateChange,
  handleVolumeChange,
} from "mx-store";
import {
  handleDurationChange,
  handleEnded,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleWaiting,
} from "mx-store";
import {
  getSubscribeFunc,
  PlayerStore,
  selectFrag,
  selectLoop,
} from "mx-store";

const { onPlay: restrictTimeOnPlay, onTimeUpdate: restrictTimeOnTimeUpdate } =
  Frag;

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
