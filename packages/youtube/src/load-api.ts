// derive from https://github.com/gajus/youtube-player/blob/master/src/loadYouTubeIframeApi.js

import load from "load-script";
import { around } from "monkey-around";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const enum IFrameAPIStatus {
  NOT_LOADED,
  LOADING,
  ERROR,
  READY,
}

let loadingPromise: Promise<typeof YT> | null = null;
/**
 * A promise that is resolved when window.onYouTubeIframeAPIReady is called.
 */
export const loadAPI = (
  iframeAPI: string = "//www.youtube.com/iframe_api",
): Promise<typeof YT> => {
  return (
    loadingPromise ??
    (loadingPromise = new Promise<typeof YT>((resolve, reject) => {
      try {
        if (window.YT && window.YT.Player instanceof Function) {
          resolve(window.YT);
          return;
        } else {
          const protocol =
            window.location.protocol === "http:" ? "http:" : "https:";

          load(protocol + iframeAPI, (error) => {
            error && reject(error);
          });
        }
        const unloader = around(window as Window, {
          // The API will call this function when page has finished downloading
          // the JavaScript for the player API.
          onYouTubeIframeAPIReady: (original) =>
            function (this: any) {
              unloader();
              resolve(window.YT);
              original && original.apply(this);
            },
        });
      } catch (error) {
        reject(error);
      }
    }).then((player) => ((loadingPromise = null), player)))
  );
};
