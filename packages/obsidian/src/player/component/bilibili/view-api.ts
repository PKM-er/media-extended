import type { IBrowserViewAPI } from "@browser-view/comms/view-api";

import type { BrowserViewEventEmitter } from "./msg-view";

export const BrowserViewAPIName = "MediaExtendedAPI";

declare global {
  interface Window {
    __ENABLE_WASM_PLAYER__?: boolean;
    [BrowserViewAPIName]: IBrowserViewAPI<BrowserViewEventEmitter>;
    __PLAYER_REF__: Partial<{
      /** exists in source html, player will be injected into this */
      playerPlaceholder: HTMLElement;
      /** player warpper, injected by javascript and including states in classlist */
      playerContainer: HTMLElement;
      video: HTMLVideoElement;
      webFscreenButton: HTMLElement;
    }>;
  }
}

export const PlayerContainerID = "bilibiliPlayer",
  PlayerPlaceholderID = "bilibili-player",
  WebFscreenBtnSelector =
    ".bilibili-player-video-btn.bilibili-player-video-web-fullscreen";

// export type ObsidianEventEmitter = EventEmitter<
//   MessageFromViewMap,
//   MessageFromObsidianMap
// >;
// export const getObsidianEventEmitter: IGetEventEmitter<
//   MessageFromViewMap,
//   MessageFromObsidianMap
// > = getEventEmitter;
// export type ViewEventEmitter = EventEmitter<
//   MessageFromObsidianMap,
//   MessageFromViewMap
// >;
// export const getViewEventEmitter: IGetEventEmitter<
//   MessageFromObsidianMap,
//   MessageFromViewMap
// > = getEventEmitter;
