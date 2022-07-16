import findPlayer from "./find-player";

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

// prevent bilibili from using wasm to do software decoding on hevc video
window.__ENABLE_WASM_PLAYER__ = false;
window.__PLAYER_REF__ = {};

findPlayer();
