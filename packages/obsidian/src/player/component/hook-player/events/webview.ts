import type { PlayerStore } from "@store";

import _hookHTMLEvents from "./html5";

export const hookHTMLEvents = (player: HTMLMediaElement, store: PlayerStore) =>
  _hookHTMLEvents(player, store);
