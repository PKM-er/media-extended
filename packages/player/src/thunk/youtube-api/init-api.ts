// derive from https://github.com/gajus/youtube-player/blob/master/src/loadYouTubeIframeApi.js

import type { PlayerRef } from "@component/youtube/utils";
import config from "@config";
import { createAsyncThunk } from "@reduxjs/toolkit";
import load from "load-script";
import { around } from "monkey-around";
import { handlePlayerReady } from "mx-store";
import {
  RootState,
  selectIsCustomControls,
  selectIsNativeControls,
} from "mx-store";

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

const baseOptions = {
  width: 0,
  height: 0,
  playerVars: {
    origin: config.origin,
    // Disable keyboard as we handle it
    disablekb: +true,
    modestbranding: +true,
    hl: "en",
  },
};

const initPlayer = createAsyncThunk<
  void,
  [ref: PlayerRef, container: HTMLElement, videoId: string],
  { state: RootState }
>(
  "youtube/initPlayer",
  async ([ref, container, videoId], { getState, dispatch }) => {
    const { Player } = await loadAPI();

    const state = getState(),
      { muted, autoplay, loop } = state.controlled;

    const elToReplace = document.createElement("div");
    // @ts-ignore something wrong with type checking in react-script...
    container.replaceChildren(elToReplace);

    const player = new Player(elToReplace, {
      ...baseOptions,
      videoId,
      playerVars: {
        ...baseOptions.playerVars,
        hl: getState().lang || "en",
        mute: +muted,
        autoplay: +autoplay,
        loop: +loop,
        controls: +selectIsNativeControls(state),
      },
      events: {
        onReady: ({ target }) => {
          // Bail if onReady has already been called.
          // See https://github.com/sampotts/plyr/issues/1108
          if (getState().youtube.playerStatus === "ready") return;
          const availableSpeeds = target.getAvailablePlaybackRates();
          dispatch(
            handlePlayerReady({
              availableSpeeds,
              duration: target.getDuration(),
            }),
          );
          // dispatch(handleDurationChange(target.getDuration()));
        },
      },
    });
    let iframe;
    // Set the tabindex to avoid focus entering iframe
    if (selectIsCustomControls(state) && (iframe = player.getIframe())) {
      iframe.tabIndex = -1;
    }
    ref.current = player;
  },
);

export default initPlayer;
