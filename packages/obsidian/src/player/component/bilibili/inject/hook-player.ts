import _hookStoreToHTMLPlayer from "@player/component/hook-player";
import {
  respondScreenshotReq,
  sendScreenshot,
} from "@player/component/hook-player/screenshot";
import {
  respondTimestampReq,
  sendTimestamp,
} from "@player/component/hook-player/timestamp";
import { PlayerStore } from "@player/store";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  const unloads = [
    _hookStoreToHTMLPlayer(player, store),
    respondTimestampReq(player, store, (...args) =>
      sendTimestamp(store.msgHandler.port!, ...args),
    ),
    respondScreenshotReq(player, store, (...args) =>
      sendScreenshot(store.msgHandler.port!, ...args),
    ),
  ];
  return () => unloads.forEach((unload) => unload());
};
export default hookStoreToHTMLPlayer;
