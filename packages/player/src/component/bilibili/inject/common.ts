import { createStore } from "@store/remote-store";
import { getSubscribeFunc } from "mx-store";

export const WebFscreenClass = "player-mode-webfullscreen",
  EndingPanelClass = "bilibili-player-ending-panel";

export const SettingButtonCls = {
  start: "bilibili-player-video-btn-start",
  quality: "bilibili-player-video-btn-quality",
  pagelist: "bilibili-player-video-btn-pagelist",
  speed: "bilibili-player-video-btn-speed",
  subtitle: "bilibili-player-video-btn-subtitle",
  volume: "bilibili-player-video-btn-volume",
  setting: "bilibili-player-video-btn-setting",
  pip: "bilibili-player-video-btn-pip",
  widescreen: "bilibili-player-video-btn-widescreen",
  webFullscreen: "bilibili-player-video-web-fullscreen",
  fullscreen: "bilibili-player-video-btn-fullscreen",
};
export const SettingMenuToggleCls = {
  videomirror: "bilibili-player-video-btn-setting-left-videomirror",
  repeat: "bilibili-player-video-btn-setting-left-repeat",
  autoplay: "bilibili-player-video-btn-setting-left-autoplay",
};

export const SettingBtnSelector = ".bilibili-player-video-btn-setting",
  SettingMenuWarpSelector = ".bilibili-player-video-btn-setting-wrap",
  PlayerControlSelector = ".bilibili-player-video-control";

export const PlayerContainerID = "bilibiliPlayer",
  PlayerPlaceholderID = "bilibili-player";

export const store = createStore(window.location.href),
  dispatch = store.dispatch,
  subscribe = getSubscribeFunc(store);
