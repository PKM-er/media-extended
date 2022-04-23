import { PlayerStore } from "@player/store";
import { HTMLMedia } from "@player/utils/media";

import { hookHTMLEvents } from "./events";
import { onStartH5 } from "./on-start";
import { hookHTMLState } from "./subc-state";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  let media = new HTMLMedia(player);
  const toUnload = [hookHTMLEvents(player, store), hookHTMLState(media, store)];
  onStartH5(media, store);
  return () => toUnload.forEach((unload) => unload());
};
export default hookStoreToHTMLPlayer;
