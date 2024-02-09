/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";

const { waitForSelector, MediaPlugin } = requireMx();

const css = `
#bilibili-player .bpx-player-control-wrap {
    opacity: 0 !important;
}
.mx-show-controls #bilibili-player .bpx-player-control-wrap {
    opacity: 100 !important;
}
`;

declare global {
  // eslint-disable-next-line no-var
  var player: any;
}

export default class BilibiliPlugin extends MediaPlugin {
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("#bilibili-player video");
  }
  getStyle() {
    return css;
  }
  async onload(): Promise<void> {
    this.controller.handle("bili_getManifest", () => {
      return { value: window.player.getManifest() };
    });
    localStorage.setItem("recommend_auto_play", "close");
    // disable autoplay
    localStorage.setItem(
      "bpx_player_profile",
      JSON.stringify({ media: { autoplay: false } }),
    );
    await super.onload();
    await this.untilMediaReady("canplay");
    await Promise.all([this.toggleDanmaku(false), this.untilWebFullscreen()]);
  }

  get player() {
    return this.media.closest<HTMLDivElement>("#bilibili-player")!;
  }

  async toggleDanmaku(val?: boolean) {
    if (window.player) {
      if (val === undefined) {
        val = !window.player.danmaku.isOpen();
      }
      if (val) {
        window.player.danmaku.open();
      } else {
        window.player.danmaku.close();
      }
      return;
    }
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
    if (this.isWebFullscreen()) {
      console.log("Already in web fullscreen");
      return;
    }
    const fsButton = await waitForSelector<HTMLDivElement>(
      ".bpx-player-ctrl-web",
      this.player,
    );
    console.log("Clicking fullscreen button");
    fsButton.click();
  }

  async untilWebFullscreen() {
    const playerEl = this.player;
    if (this.isWebFullscreen()) return;
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
