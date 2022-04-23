import { getPortWithTimeout } from "@ipc/get-port";
import { initStateFromHost } from "@ipc/redux-sync";
import { getSubscribeFunc } from "@player/store";
import { createStore } from "@player/store/remote-store";

import { BrowserViewAPIName } from "../view-api";
import { hookBilibiliControls } from "./controls";
import findPlayer from "./find-player";

console.log("running injected script");

// prevent bilibili from using wasm to do software decoding on hevc video
window.__ENABLE_WASM_PLAYER__ = false;
window.__PLAYER_REF__ = {};

const store = createStore(window.location.href);
window[BrowserViewAPIName] = {
  store,
};

export const subscribe = getSubscribeFunc(store);

getPortWithTimeout(
  (resolve) =>
    ({ data, ports }: MessageEvent<any>) => {
      if (data === "port") {
        const [port] = ports;
        resolve([port]);
      }
    },
  (handler) => window.addEventListener("message", handler),
  (handler) => window.removeEventListener("message", handler),
).then(([port]) => {
  store.msgHandler.port = port;
  initStateFromHost(store);
});

findPlayer((ref) => {
  hookBilibiliControls();
});
