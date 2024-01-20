// hugely inspired by https://greasyfork.org/zh-CN/scripts/4870-maximize-video

const css = `
.mx-player {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  z-index: 2147483647; /* Ensure it's on top of other elements */
  background-color: #000;
  transform: none;
}
.mx-parent {
  overflow: visible !important;
  z-index: auto !important;
  transform: none !important;
  -webkit-transform-style: flat !important;
  transition: none !important;
  contain: none !important;
}
.mx-absolute {
  position: absolute !important;
}
html, body {
  overflow: hidden !important;
  zoom: 100% !important;
}
.mx-parent video {
  object-fit: contain !important;
}
`;

/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";

const { waitForSelector, MediaPlugin } = requireMx();

export default class BilibiliPlugin extends MediaPlugin {
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("#ytd-player video");
  }
  async onload(): Promise<void> {
    await super.onload();
    this.injectStyle(css);
    const app = document.querySelector<HTMLElement>("ytd-app");
    if (!app) {
      throw new Error("Bind failed: #ytd-app not found");
    }
    this.#app = app;
    await Promise.all([
      this.untilMediaReady("canplay"),
      this.enterWebFullscreen(),
    ]);
  }

  #app: HTMLElement | null = null;
  get app() {
    if (!this.#app) {
      throw new Error("Get player before load");
    }
    return this.#app;
  }

  async enterWebFullscreen() {
    const cinematicsModeSelector = "#player-theater-container #movie_player";
    const isCinematicsMode = () =>
      !!this.app.querySelector(cinematicsModeSelector);
    if (isCinematicsMode()) {
      const fsButton = await waitForSelector<HTMLButtonElement>(
        "#movie_player .ytp-size-button",
        this.app,
      );
      fsButton.click();
      await waitForSelector(cinematicsModeSelector, this.app);
    }
    const moviePlayer = await waitForSelector<HTMLDivElement>(
      "#movie_player",
      this.app,
    );
    moviePlayer.classList.add("mx-player");
    for (const parent of parents(moviePlayer)) {
      parent.classList.add("mx-parent");
      if (getComputedStyle(parent).position == "fixed") {
        parent.classList.add("mx-absolute");
      }
    }
    window.dispatchEvent(new Event("resize"));
  }
}

function* parents(element: HTMLElement, includeSelf = false) {
  if (includeSelf) yield element;
  // break if element is document.body
  while (element.parentElement && element.parentElement !== document.body) {
    element = element.parentElement;
    yield element;
  }
}
