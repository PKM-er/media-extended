import { initStateFromHost } from "mx-store";

import {
  EndingPanelClass,
  SettingButtonCls,
  SettingMenuWarpSelector,
  store,
} from "./common";
import { hookBilibiliControls } from "./controls";
import findPlayer, { HideMenuClass } from "./find-player";

console.log("running injected script");

window.MX_MESSAGE_PORT.then((port) => {
  store.msgHandler.port = port;
  initStateFromHost(store);
});

// hide bulti-in controls
const toSelector = (cls: string) => `.${cls}`;
const styleEl = document.createElement("style");
const { fullscreen, widescreen, speed, volume, start } = SettingButtonCls;
styleEl.textContent = `
  ${[
    toSelector(fullscreen),
    toSelector(widescreen),
    toSelector(speed),
    toSelector(volume),
    toSelector(start),
    toSelector(HideMenuClass) + SettingMenuWarpSelector,
    toSelector(EndingPanelClass),
  ].join(",")} {
    display: none !important;
  }
  `;
document.head.append(styleEl);

// prevent bilibili from using wasm to do software decoding on hevc video
window.__ENABLE_WASM_PLAYER__ = false;
window.__PLAYER_REF__ = {};

findPlayer((ref) => {
  hookBilibiliControls();
});
