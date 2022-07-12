import { Media } from "mx-base";
import {
  PlayerStore,
  selectCurrentTime,
  selectPaused,
  selectSpeed,
  selectVolumeMute,
} from "mx-store";

const onStart = (player: Media, store: PlayerStore) => {
  const initState = store.getState();
  const currentTime = selectCurrentTime(initState);
  if (currentTime && currentTime > 0) {
    player.seekTo(currentTime);
  }
  const paused = selectPaused(initState),
    [muted, volume] = selectVolumeMute(initState),
    speed = selectSpeed(initState);
  if (paused !== player.paused) {
    player[paused ? "pause" : "play"]();
  }
  if (muted !== undefined) {
    if (muted !== player.muted) {
      player.muted = muted;
    }
    if (volume !== player.volume) {
      player.volume = volume;
    }
  }
  if (speed && speed !== player.playbackRate) {
    player.playbackRate = speed;
  }
};

export default onStart;
