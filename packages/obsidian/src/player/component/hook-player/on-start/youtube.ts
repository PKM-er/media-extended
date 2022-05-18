import { YoutubeMedia } from "@player/utils/media";
import { PlayerStore } from "@store";

import onStart from "./general";

export const onStartYtb = (media: YoutubeMedia, store: PlayerStore) => {
  onStart(media, store);
  // const player = media.instance;
};
