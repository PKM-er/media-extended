import { getPortWithTimeout } from "@browser-view/comms/get-port-base";
import { EventEmitter } from "@browser-view/emitter";

import { BrowserViewAPIName } from "../view-api";
import registerEvents from "./events";
import findPlayer from "./find-player";
import { EmitWebFscreenEvt, EnterWebFscreen } from "./fullscreen";

console.log("running injected script");

// prevent bilibili from using wasm to do software decoding on hevc video
window.__ENABLE_WASM_PLAYER__ = false;
window.__PLAYER_REF__ = {};

const port = getPortWithTimeout(
  (resolve) =>
    ({ data, ports }: MessageEvent<any>) => {
      if (data === "port") {
        const [port] = ports;
        resolve([port]);
      }
    },
  (handler) => window.addEventListener("message", handler),
  (handler) => window.removeEventListener("message", handler),
).then(([port]) => port);
window[BrowserViewAPIName] = {
  emitter: new EventEmitter(port),
};

findPlayer();
registerEvents();
EnterWebFscreen();
EmitWebFscreenEvt();
