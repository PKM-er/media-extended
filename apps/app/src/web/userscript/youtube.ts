// hugely inspired by https://greasyfork.org/zh-CN/scripts/4870-maximize-video

const css = `
ytd-watch-flexy[theater] #movie_player {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  z-index: 2147483647 !important; /* Ensure it's on top of other elements */
  background-color: #000 !important;
  transform: none !important;
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
ytd-app .html5-endscreen {
  opacity: 0 !important;
}
ytd-app .ytp-chrome-bottom {
  opacity: 0 !important;
}
ytd-app.mx-show-controls .ytp-chrome-bottom {
  opacity: 100 !important;
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
    this.injectStyle(css);
    await super.onload();
    const app = document.querySelector<HTMLElement>("ytd-app");
    if (!app) {
      throw new Error("Bind failed: #ytd-app not found");
    }
    this.#app = app;

    await Promise.all([
      this.untilMediaReady("canplay").then(() => {
        this.register(
          this.controller.on(
            "mx-toggle-controls",
            ({ payload: showWebsite }) => {
              this.app.classList.toggle("mx-show-controls", showWebsite);
            },
          ),
        );
      }),
      await this.disableAutoPlay(),
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

  async disableAutoPlay() {
    console.log("Disabling autoplay...");
    const autoPlayButtonSelector =
      'button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]';
    const autoPlayButton = this.app.querySelector<HTMLButtonElement>(
      autoPlayButtonSelector,
    );

    if (!autoPlayButton) {
      throw new Error("Autoplay button not found");
    }

    const label = autoPlayButton.querySelector(".ytp-autonav-toggle-button");
    if (!label) {
      throw new Error("Autoplay button label not found");
    }

    const isAutoPlayEnabled = () =>
      label.getAttribute("aria-checked") === "true";

    if (isAutoPlayEnabled()) {
      console.log("Autoplay is enabled, disabling...");
      autoPlayButton.click();
      await new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (!isAutoPlayEnabled()) {
            observer.disconnect();
            resolve();
          }
        });
        console.log("Waiting for autoplay to be disabled...");
        observer.observe(label, { attributes: true });
      });
    }
  }

  async enterWebFullscreen() {
    const moviePlayer = await waitForSelector<HTMLDivElement>(
      "#movie_player",
      this.app,
    );
    for (const parent of parents(moviePlayer)) {
      parent.classList.add("mx-parent");
      if (getComputedStyle(parent).position == "fixed") {
        parent.classList.add("mx-absolute");
      }
    }
    console.log("added parent classes");

    const isCinematicsMode = () =>
      !!this.app.querySelector("ytd-watch-flexy[theater]");
    if (!isCinematicsMode()) {
      const fsButton = await waitForSelector<HTMLButtonElement>(
        "#movie_player .ytp-size-button",
        this.app,
      );
      console.log("Entering cinema mode");
      do {
        fsButton.click();
        await sleep(200);
      } while (!isCinematicsMode());
      console.log("Entered cinema mode");
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
