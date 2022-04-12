// import { contextBridge } from "electron";
import PreloadSetup from "@ipc/preload";
import InjectCode from "inline:./inject";
// import { BrowserViewAPIName } from "./view-api";

const api = PreloadSetup(InjectCode, "https://www.bilibili.com");
window.addEventListener("DOMContentLoaded", () => {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
  .bilibili-player-video-btn.bilibili-player-video-btn-fullscreen, 
  .bilibili-player-video-btn.bilibili-player-video-btn-widescreen {
    display: none !important;
  }
  `;
  document.head.append(styleEl);
});
// contextBridge.exposeInMainWorld(BrowserViewAPIName, api);
