import type { PlayerStore } from "@player/store";
import type { HTMLMedia } from "@player/utils/media";

import _hookHTMLState from "./html5";

export const hookHTMLState = (media: HTMLMedia, store: PlayerStore) =>
  _hookHTMLState(media, store);
