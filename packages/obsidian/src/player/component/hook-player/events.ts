import {
  onPlay as restrictTimeOnPlay,
  onTimeUpdate as restrictTimeOnTimeUpdate,
} from "@base/fragment";
import { Source } from "@player/slice/provider/types";
import {
  AppDispatch,
  getSubscribeFunc,
  PlayerStore,
  RootState,
} from "@player/store";
import { HTMLMedia, Media } from "@player/utils/media";
import {
  handleDurationChange,
  handleEnded,
  handleError,
  handlePause,
  handlePlaying,
  handleProgress,
  handleRateChange,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleVolumeChange,
  handleWaiting,
} from "@slice/controls";
import { renameStateReverted } from "@slice/provider";

import { selectFrag, updateBuffer, updateRatio } from "./common";

const hookEvents = (player: HTMLMediaElement, store: PlayerStore) => {
  const subscribe = getSubscribeFunc(store),
    dispatch = (action: Parameters<AppDispatch>[0]) => store.dispatch(action);

  const media = new HTMLMedia(player) as Media<"html5">;

  let frag: [number, number] | null;
  const unloadFragSub = subscribe(
    selectFrag,
    (newFrag) => (frag = newFrag),
    true,
  );

  const events: Parameters<HTMLMediaElement["addEventListener"]>[] = [
    ["ratechange", () => dispatch(handleRateChange(media.playbackRate))],
    [
      "play",
      () => {
        dispatch(handlePlaying());
        restrictTimeOnPlay(frag, media);
      },
    ],
    ["pause", () => dispatch(handlePause())],
    [
      "timeupdate",
      () => {
        dispatch(handleTimeUpdate(media.currentTime));
        restrictTimeOnTimeUpdate(frag, media, player.loop);
      },
    ],
    ["canplay", () => updateBuffer(player, dispatch)],
    [
      "volumechange",
      () =>
        dispatch(
          handleVolumeChange({ volume: media.volume, muted: media.muted }),
        ),
    ],
    ["durationchange", () => dispatch(handleDurationChange(media.duration))],
    [
      "loadedmetadata",
      () => {
        // useUpdateRatio
        updateRatio(player, dispatch);
        // useRevertTimeOnRename
        const renamed = store.getState().provider.renamed;
        if (renamed) {
          player.currentTime = renamed.time;
          dispatch(renameStateReverted());
        }
      },
    ],
    ["seeked", () => dispatch(handleSeeked())],
    ["seeking", () => dispatch(handleSeeking())],
    ["waiting", () => dispatch(handleWaiting())],
    ["progress", () => updateBuffer(player, dispatch)],
    ["ended", () => dispatch(handleEnded())],
    [
      "error",
      () => {
        const { error } = player;
        if (error)
          dispatch(handleError({ message: error.message, code: error.code }));
      },
    ],
  ];
  for (const args of events) {
    player.addEventListener(...args);
  }
  return () => {
    for (const args of events) {
      player.removeEventListener(...args);
    }
    unloadFragSub();
  };
};

export default hookEvents;
