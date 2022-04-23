import { PlayerStore } from "@player/store";
import { getBuffered } from "@player/utils/get-buffered";
import { updateBasicInfo } from "@slice/controls";

import { updateRatio } from "./common";

const onStart = (player: HTMLMediaElement, store: PlayerStore) => {
  store.dispatch(
    updateBasicInfo({
      seeking: player.seeking,
      duration: player.duration,
      buffered: getBuffered(player),
    }),
  );
  updateRatio(player, store.dispatch);
  const { currentTime } = store.getState().controls;
  if (currentTime > 0) {
    player.currentTime = currentTime;
  }
};

export default onStart;
