// derive from https://github.com/gajus/youtube-player/blob/master/src/loadYouTubeIframeApi.js

import config from "@player/config";
import load from "load-script";
import { around } from "monkey-around";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * A promise that is resolved when window.onYouTubeIframeAPIReady is called.
 */
const loadAPI = (): Promise<typeof YT> =>
  new Promise((resolve, reject) => {
    try {
      if (
        window.YT &&
        window.YT.Player &&
        window.YT.Player instanceof Function
      ) {
        resolve(window.YT);
        return;
      } else {
        const protocol =
          window.location.protocol === "http:" ? "http:" : "https:";

        load(protocol + config.urls.youtube.iframe_api, (error) => {
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
  });
export default loadAPI;
