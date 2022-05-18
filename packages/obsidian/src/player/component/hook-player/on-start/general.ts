import { Media } from "@player/utils/media";
import { PlayerStore, selectCurrentTime } from "@store";

const onStart = (player: Media, store: PlayerStore) => {
  const currentTime = selectCurrentTime(store.getState());
  if (currentTime > 0) {
    player.seekTo(currentTime);
  }
};

export default onStart;
