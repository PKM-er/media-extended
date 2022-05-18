import type { HTMLMedia } from "@player/utils/media";
import type { PlayerStore } from "@store";

import _hookHTMLState from "./html5";

export const hookHTMLState = (media: HTMLMedia, store: PlayerStore) =>
  _hookHTMLState(media, store);
