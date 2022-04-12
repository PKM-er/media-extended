import { BrowserViewAPIName, WebFscreenBtnSelector } from "../view-api";
import { PlyaerFoundEvent } from "./find-player";

const WebFullscreenClass = "player-mode-webfullscreen";

export const EnterWebFscreen = () => {
  window.addEventListener(
    PlyaerFoundEvent,
    () => {
      // enter web fullscreen on load
      const container = window.__PLAYER_REF__.playerPlaceholder ?? document;
      const webFscreenBtn = container.querySelector<HTMLElement>(
        WebFscreenBtnSelector,
      );
      if (webFscreenBtn) {
        window.__PLAYER_REF__.webFscreenButton = webFscreenBtn;
        console.log("enabling web fullscreen");
        webFscreenBtn.click();
      } else {
        console.error("failed to enter web fullscreen");
      }

      // enable web fullscreen when player is in fullscreen mode
      window[BrowserViewAPIName].emitter.on("enter-fullscreen", () => {
        if (!document.body.classList.contains(WebFullscreenClass)) {
          window.__PLAYER_REF__.webFscreenButton?.click();
        }
      });
    },
    { once: true },
  );
};
export const EmitWebFscreenEvt = () => {
  let prevClass: string[] = [];
  const modeObs = new MutationObserver(() => {
    const newClass = [...document.body.classList.values()];
    const isPrevFs = prevClass.includes(WebFullscreenClass),
      isNowFs = newClass.includes(WebFullscreenClass);
    if (isPrevFs !== isNowFs) {
      window.MediaExtendedAPI.emitter.send(
        isNowFs ? "enter-web-fullscreen" : "exit-web-fullscreen",
      );
    }
    prevClass = newClass;
  });
  modeObs.observe(document.body, {
    attributeFilter: ["class"],
  });
};
