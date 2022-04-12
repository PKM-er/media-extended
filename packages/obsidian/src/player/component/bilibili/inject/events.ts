import { registerMsgHandler } from "../msg-obs";
import { HookMediaEvents } from "../msg-view";
import { BrowserViewAPIName } from "../view-api";
import { PlyaerFoundEvent } from "./find-player";

const registerEvents = () => {
  window.addEventListener(
    PlyaerFoundEvent,
    () => {
      const player = window.__PLAYER_REF__.video;
      if (!player) {
        console.error(
          "failed to hook event: player not available when player-found dispatched",
          window.__PLAYER_REF__,
        );
        return;
      }
      HookMediaEvents(player, window[BrowserViewAPIName].emitter);
      registerMsgHandler(window[BrowserViewAPIName].emitter, player);
    },
    { once: true },
  );
};
export default registerEvents;
