import { hookHTMLEvents } from "@hook-player/events/webview";
import { onStartH5 } from "@hook-player/on-start";
import { respondScreenshotReq, sendScreenshot } from "@hook-player/screenshot";
import { hookHTMLState } from "@hook-player/subc-state/webview";
import { respondTimestampReq, sendTimestamp } from "@hook-player/timestamp";
import { HTMLMedia } from "@player/utils/media";
import { PlayerStore } from "@store";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  let media = new HTMLMedia(player);
  onStartH5(media, store);
  const toUnload = [
    hookHTMLEvents(player, store),
    hookHTMLState(media, store),
    respondTimestampReq(new HTMLMedia(player), store, (...args) =>
      sendTimestamp(store.msgHandler.port!, ...args),
    ),
    respondScreenshotReq(player, store, (...args) =>
      sendScreenshot(store.msgHandler.port!, ...args),
    ),
  ];
  return () => toUnload.forEach((unload) => unload());
};
export default hookStoreToHTMLPlayer;
