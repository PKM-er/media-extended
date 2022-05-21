// import type { IWebViewAPI } from "@ipc/remote-view/view-api";

export const WebViewAPIName = "MediaExtendedAPI";

declare global {
  interface Window {
    __ENABLE_WASM_PLAYER__?: boolean;
    // [WebViewAPIName]: IWebViewAPI;
    __PLAYER_REF__: Partial<{
      /** exists in source html, player will be injected into this */
      playerPlaceholder: HTMLElement;
      /** player warpper, injected by javascript and including states in classlist */
      playerContainer: HTMLElement;
      video: HTMLVideoElement;
      controls: HTMLElement;
      settingsMenuWarp: HTMLElement;
    }>;
  }
}
