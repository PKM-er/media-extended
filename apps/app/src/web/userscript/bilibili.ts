/* eslint-disable @typescript-eslint/naming-convention */
import type { TextTrackInit, VTTContent } from "@vidstack/react";
import { BiliApiError } from "../bili-api/base";
import type { PlayerV2Response } from "../bili-api/player-v2";
import type { SubtitlesConfig } from "../bili-api/subtitle";
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
  #playerV2API: string | null = null;
  #subtitleUrl = new Map<string, string>();
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("#bilibili-player video");
  }
  getStyle() {
    return css;
  }
  async getTracks(): Promise<(TextTrackInit & { id: string })[]> {
    if (!this.#playerV2API) {
      console.error("Player V2 API not loaded");
      return [];
    }
    try {
      const resp = await fetch(this.#playerV2API, { credentials: "include" });
      if (!resp.ok) {
        throw new Error("Failed to fetch player V2 API, " + resp.statusText);
      }
      const json = (await resp.json()) as PlayerV2Response;
      console.debug("Fetching player V2 API", this.#playerV2API, json);
      if (json.code !== 0) {
        throw new BiliApiError(json.message, json.code);
      }
      return json.data.subtitle.subtitles.map((sub) => {
        const track = {
          id: sub.id.toString(),
          kind: "subtitles",
          label: sub.lan_doc,
          language: sub.lan.startsWith("ai-") ? sub.lan.substring(3) : sub.lan,
        } satisfies TextTrackInit;
        this.#subtitleUrl.set(track.id, sub.subtitle_url);
        return track;
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  async getTrack(id: string): Promise<VTTContent | null> {
    const url = this.#subtitleUrl.get(id);
    if (!url) return null;
    const resp = await fetch(url);
    if (!resp.ok)
      throw new Error("Failed to fetch subtitle, " + resp.statusText);
    const json = (await resp.json()) as SubtitlesConfig;
    return {
      cues: json.body.map((sub) => ({
        startTime: sub.from,
        endTime: sub.to,
        text: sub.content,
      })),
    };
  }
  async onload(): Promise<void> {
    this.register(
      this.controller.handle("bili_getManifest", () => {
        return { value: window.player.getManifest() };
      }),
    );
    this.register(
      this.controller.on("mx-bili-player-v2-url", ({ payload }) => {
        this.#playerV2API = payload;
        console.debug("Player V2 API received");
        this.getTracks()
          .then((tracks) => {
            console.debug("Sending tracks to remote", tracks);
            if (tracks.length === 0) return;
            this.controller.send("mx-text-tracks", { tracks });
          })
          .catch((e) => {
            console.error("Failed to get tracks", e);
          });
      }),
    );
    localStorage.setItem("recommend_auto_play", "close");
    // disable autoplay
    localStorage.setItem(
      "bpx_player_profile",
      JSON.stringify({ media: { autoplay: false } }),
    );
    await super.onload();
    this.revertAutoSeek();
    Promise.all([this.toggleDanmaku(false)]);
    await this.untilWebFullscreen();
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

  enterWebFullscreen() {
    if (this.isWebFullscreen()) {
      console.log("Already in web fullscreen");
      return;
    }
    waitForSelector<HTMLDivElement>(".bpx-player-ctrl-web", this.player).then(
      (fsButton) => {
        console.log("Clicking fullscreen button");
        fsButton.click();
      },
    );
  }

  revertAutoSeek() {
    const plyaer = this.player;
    const toastContainer = plyaer.querySelector<HTMLDivElement>(
      ".bpx-player-toast-auto",
    );
    if (!toastContainer) {
      console.log("toast container not found");
      return;
    }

    const handler = () => {
      if (
        this.stateRef.prevSeek &&
        this.stateRef.prevSeek.time > Date.now() - 5e3
      ) {
        // if the seek is recent (within 5 seconds)
        this.media.currentTime = this.stateRef.prevSeek.value;
      } else {
        this.media.currentTime = 0;
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations
        .find((m) => m.type === "childList" && m.addedNodes.length > 0)
        ?.addedNodes.forEach((node) => {
          if (node.textContent?.includes("已为您定位至")) {
            (node as HTMLDivElement).style.opacity = "0";
            handler();
          }
        });
    });
    observer.observe(toastContainer, {
      childList: true,
      subtree: true,
    });
    this.register(() => observer.disconnect());
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
      setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, 6e3);
    });
  }
}
