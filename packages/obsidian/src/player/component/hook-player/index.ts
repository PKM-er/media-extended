import { PlayerStore } from "@player/store";

import hookEvents from "./events";
import onStart from "./on-start";
import hookState from "./subc-state";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  const toUnload = [hookEvents(player, store), hookState(player, store)];
  onStart(player, store);
  return () => toUnload.forEach((unload) => unload());
};
export default hookStoreToHTMLPlayer;
