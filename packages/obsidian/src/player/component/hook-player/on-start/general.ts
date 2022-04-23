import { PlayerStore } from "@player/store";
import { Media } from "@player/utils/media";

const onStart = (player: Media, store: PlayerStore) => {
  const { currentTime } = store.getState().controls;
  if (currentTime > 0) {
    player.seekTo(currentTime);
  }
};

export default onStart;
