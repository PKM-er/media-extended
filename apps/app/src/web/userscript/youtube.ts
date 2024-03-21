/* eslint-disable no-var */
// hugely inspired by https://greasyfork.org/zh-CN/scripts/4870-maximize-video

declare global {
  var ytInitialPlayerResponse: any;
}

const css = `
body:not(.mx-player-ready) #movie_player, 
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
body:not(.mx-show-controls) ytd-app .ytp-chrome-bottom {
  opacity: 0 !important;
}
`.trim();

/**
 * @see https://github.com/iamfugui/YouTubeADB/tree/b0bdfa35878d01dd0be6696f1a027e2fe8aa2492
 */
const hideAD = `
/* 首页顶部横幅广告 */
#masthead-ad, 
/* 首页视频排版广告 */
ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer), 
/* 播放器底部广告 */
.video-ads.ytp-ad-module, 
/* 播放页会员促销广告 */
tp-yt-paper-dialog:has(yt-mealbar-promo-renderer), 
/* 播放页右上方推荐广告 */
ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"], 
/* 播放页评论区右侧推广广告 */
#related #player-ads, 
/* 播放页评论区右侧视频排版广告 */
#related ytd-ad-slot-renderer, 
/* 搜索页广告 */
ytd-ad-slot-renderer, 
/* 播放页会员推荐广告 */
yt-mealbar-promo-renderer, 
/* M播放页第三方推荐广 */
ad-slot-renderer, 
/* M可跳过的视频广告链接 */
ytm-companion-ad-renderer {
  opacity: 0 !important;
}
`.trim();

import type { TextTrackInit, VTTContent } from "@vidstack/react";
/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";

const { waitForSelector, MediaPlugin } = requireMx();

export default class YouTubePlugin extends MediaPlugin {
  async findMedia(): Promise<HTMLMediaElement> {
    const media = await waitForSelector<HTMLMediaElement>(
      "ytd-app #movie_player video",
    );
    this.app = media.closest<HTMLElement>("ytd-app")!;
    this.moviePlayer = media.closest<HTMLElement>("#movie_player")!;
    if (!this.app || !this.moviePlayer) {
      throw new Error("Failed to find media");
    }
    this.watchIfDetached();
    return media;
  }

  captionSrc = new Map<string, string>();

  getTracks(): (TextTrackInit & { id: string })[] {
    const tracks =
      window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer
        ?.captionTracks;
    if (!Array.isArray(tracks)) return [];

    return tracks.map((t, i) => {
      const track = t as {
        baseUrl: string;
        isTranslatable?: boolean;
        languageCode?: string;
        name?: { simpleText?: string };
        trackName?: string;
        vssId?: string;
      };
      const id = track.vssId || `tract${i}`;
      this.captionSrc.set(id, track.baseUrl);
      return {
        id,
        kind: "subtitles",
        language: track.languageCode || "en",
        label: track.name?.simpleText || track.trackName || "Unknown",
      } satisfies TextTrackInit;
    });
  }
  parser = new DOMParser();
  async getTrack(_id: string): Promise<VTTContent | null> {
    const src = this.captionSrc.get(_id);
    if (!src) return null;
    const resp = await fetch(src);
    if (!resp.ok) return null;
    const xml = await resp.text();
    const xmlDoc = this.parser.parseFromString(xml, "text/xml");
    const textElements = xmlDoc.getElementsByTagName("text");
    const vtt: VTTContent = { cues: [] };
    for (const text of textElements) {
      const startTime = parseFloat(text.getAttribute("start")!);
      const dur = parseFloat(text.getAttribute("dur")!);
      const endTime = startTime + dur;
      vtt.cues!.push({ startTime, endTime, text: text.textContent! });
    }
    return vtt;
  }

  watchIfDetached() {
    const container = this.moviePlayer;
    const observer = new MutationObserver(async () => {
      if (this.media.isConnected) return;
      console.log("Re-attaching media");
      const lastest = await this.findMedia();
      if (!lastest) return;
      console.log("found media");
      this.rehookMediaEl(lastest);
      console.log("media hooked");
    });
    observer.observe(container, { childList: true, subtree: true });
    this.register(() => observer.disconnect());
  }

  getStyle() {
    return css + "\n" + hideAD;
  }
  async onload(): Promise<void> {
    await super.onload();
    const tracks = this.getTracks();
    if (tracks.length > 0) this.controller.send("mx-text-tracks", { tracks });
    this.disableAutoPlay();
    waitForSelector("ytd-consent-bump-v2-lightbox", this.app).then(() => {
      this.controller.send("mx-open-browser", {
        message:
          "Seems like YouTube is showing a consent popup that block playback. To continue playback, you should handle it in dedicated login browser. ",
        url: "https://youtube.com",
      });
    });
  }

  app!: HTMLElement;
  moviePlayer!: HTMLElement;

  async disableAutoPlay() {
    console.log("Disabling autoplay...");
    const autoPlayButtonSelector =
      'button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]';
    const autoPlayButton = await waitForSelector<HTMLButtonElement>(
      autoPlayButtonSelector,
      this.app,
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

  enterWebFullscreen() {
    this.assignParentClass(this.moviePlayer);

    (async () => {
      const fsButton = await waitForSelector<HTMLButtonElement>(
        "#movie_player .ytp-size-button",
      );
      const isCinematicsMode = () =>
        !!this.app.querySelector("ytd-watch-flexy[theater]");
      if (!isCinematicsMode()) {
        console.log("Entering cinema mode");
        do {
          fsButton.click();
          await sleep(200);
        } while (!isCinematicsMode());
        console.log("Entered cinema mode");
      }
      window.dispatchEvent(new Event("resize"));
    })();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
