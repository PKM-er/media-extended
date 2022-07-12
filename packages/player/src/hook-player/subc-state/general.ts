import { Media } from "mx-base";
import { Frag } from "mx-base";
const { onFragUpdate } = Frag;
import { getSubscribeFunc, PlayerStore, selectFrag } from "mx-store";

const hookState = (media: Media, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store);

  let playPromise: Promise<void> | void;
  const play = async () => {
    if (!playPromise) {
      playPromise = media.play();
      await playPromise;
      playPromise = undefined;
    }
  };
  const pause = async () => {
    await playPromise;
    if (playPromise) playPromise = undefined;
    media.pause();
  };

  const toUnload: (() => void)[] = [
    // useApplyTimeFragment
    subscribe(selectFrag, (newFrag) => onFragUpdate(newFrag, media)),
    // useApplyPlaybackRate
    store.emitter.on("setPlaybackRate", (rate) => {
      media.playbackRate !== rate && (media.playbackRate = rate);
    }),
    // useApplyVolume
    store.emitter.on("setVolumeUnmute", (volume) => {
      media.volume !== volume && (media.volume = volume);
      media.muted = false;
    }),
    store.emitter.on("setVolume", (volume) => {
      media.volume !== volume && (media.volume = volume);
    }),
    store.emitter.on("setVolumeByOffest", (volumeOffset) => {
      media.volume = volumeOffset / 100 + media.volume;
    }),
    store.emitter.on("setMute", (muted) => {
      media.muted = muted;
    }),
    store.emitter.on("toggleMute", () => {
      media.muted = !media.muted;
    }),
    store.emitter.on("togglePlay", () => {
      media.paused ? play() : pause();
    }),
    store.emitter.on("play", () => {
      if (media.paused) play();
    }),
    store.emitter.on("pause", () => {
      if (!media.paused) pause();
    }),
    // useApplyUserSeek
    subscribe(
      (state) => state.player.userSeek,
      (seek, prevSeek) => {
        let params:
          | [time: number, options: { allowSeekAhead: boolean }]
          | null = null;
        // https://developers.google.com/youtube/iframe_api_reference#seekTo
        if (seek) {
          params = [seek.currentTime, { allowSeekAhead: false }];
        } else if (prevSeek) {
          // seek ends
          params = [prevSeek.currentTime, { allowSeekAhead: true }];
        }
        if (params) {
          media.seekTo(...params);
        }
      },
    ),
  ];

  return () => toUnload.forEach((unload) => unload());
};
export default hookState;
