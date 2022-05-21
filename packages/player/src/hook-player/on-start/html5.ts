import { getBuffered } from "@utils/get-buffered";
import { HTMLMedia } from "@utils/media";
import { updateBasicInfo } from "mx-store";
import { PlayerStore } from "mx-store";

import { updateRatio } from "../common";
import onStart from "./general";

export const onStartH5 = (media: HTMLMedia, store: PlayerStore) => {
  onStart(media, store);
  const player = media.instance;
  store.dispatch(
    updateBasicInfo({
      seeking: player.seeking,
      duration: player.duration,
      buffered: getBuffered(player),
    }),
  );
  updateRatio(player, store.dispatch);
};
