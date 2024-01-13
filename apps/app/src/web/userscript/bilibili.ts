/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";

const { waitForSelector, MediaPlugin } = requireMx();

export default class BilibiliPlugin extends MediaPlugin {
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("#bilibili-player video");
  }
  async onload(): Promise<void> {
    await super.onload();
    // this.untilMediaReady("loadeddata").then(() => {
    //   this.preventAutoplay();
    // });
    // this.preventAutoplay();
    // disable auto play recommendation
    localStorage.setItem("recommend_auto_play", "close");
    const player = document.querySelector<HTMLDivElement>("#bilibili-player");
    if (!player) {
      throw new Error("Bind failed: #bilibili-player not found");
    }
    this.#player = player;
    await this.untilMediaReady("canplay");
    await this.toggleDanmaku(false);
    await this.enterWebFullscreen();
  }

  #player: HTMLDivElement | null = null;
  get player() {
    if (!this.#player) {
      throw new Error("Get player before load");
    }
    return this.#player;
  }

  async toggleDanmaku(val?: boolean) {
    const danmakuSwitchEl = await waitForSelector<HTMLDivElement>(
      ".bui-danmaku-switch",
      this.player,
    );
    if (!danmakuSwitchEl) {
      console.error("danmaku switch not found");
      return;
    }
    const danmakuButton = danmakuSwitchEl.querySelector<HTMLInputElement>(
      "input.bui-danmaku-switch-input",
    );
    if (!danmakuButton) {
      console.error("danmaku button not found");
      return;
    }
    if (val === undefined) {
      danmakuButton.click();
      return;
    }
    if (val === this.isDanmakuOn(danmakuSwitchEl)) return;
    danmakuButton.click();
  }

  // if danmaku is on (by checking if off label is hidden)
  isDanmakuOn(switchEl: HTMLDivElement) {
    return (
      switchEl.querySelector<HTMLDivElement>(".bui-danmaku-switch-off")
        ?.offsetHeight === 0
    );
  }

  isWebFullscreen() {
    return this.player.classList.contains("mode-webscreen");
  }

  async enterWebFullscreen() {
    if (this.isWebFullscreen()) return;
    const fsButton = await waitForSelector<HTMLDivElement>(
      "div.bpx-player-ctrl-btn.bpx-player-ctrl-web",
      this.player,
    );
    fsButton.click();
    // wait for playerEl to have class mode-webscreen
    await this.untilWebFullscreen();
  }

  async untilWebFullscreen() {
    const playerEl = this.player;
    await new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const mutation = mutations.find(
          (m) =>
            m.type === "attributes" &&
            m.attributeName === "class" &&
            playerEl?.classList.contains("mode-webscreen"),
        );
        if (mutation) {
          observer.disconnect();
          resolve(undefined);
        }
      });
      observer.observe(playerEl, { attributes: true });
      // timeout after 2 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, 2e3);
    });
  }
}
