import { Media } from "mx-base";
import { PlayerStore, selectCurrentTime } from "mx-store";

const onStart = (player: Media, store: PlayerStore) => {
  const currentTime = selectCurrentTime(store.getState());
  if (currentTime && currentTime > 0) {
    player.seekTo(currentTime);
  }
};

export default onStart;
