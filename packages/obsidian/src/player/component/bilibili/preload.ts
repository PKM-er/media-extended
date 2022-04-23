// import { contextBridge } from "electron";
import PreloadSetup from "@ipc/remote-view/preload";
import InjectCode from "inline:./inject";

import {
  EndingPanelClass,
  SettingButtonCls,
  SettingMenuWarpSelector,
} from "./inject/const";
import { HideMenuClass } from "./inject/find-player";
// import { BrowserViewAPIName } from "./view-api";

const toSelector = (cls: string) => `.${cls}`;

const api = PreloadSetup(InjectCode, "https://www.bilibili.com");
window.addEventListener("DOMContentLoaded", () => {
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
});
// contextBridge.exposeInMainWorld(BrowserViewAPIName, api);
