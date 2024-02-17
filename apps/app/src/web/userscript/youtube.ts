// hugely inspired by https://greasyfork.org/zh-CN/scripts/4870-maximize-video

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

/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";

const { waitForSelector, MediaPlugin } = requireMx();

export default class BilibiliPlugin extends MediaPlugin {
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("ytd-app #movie_player video");
  }

  getStyle() {
    return css + "\n" + hideAD;
  }
  async onload(): Promise<void> {
    await super.onload();
    Promise.all([
      waitForSelector<HTMLElement>(".video-ads.ytp-ad-module", this.app).then(
        (adModule) => this.removePlayerAD(adModule),
      ),
      this.disableAutoPlay(),
    ]);
  }

  get app() {
    return this.media.closest<HTMLElement>("ytd-app")!;
  }
  get moviePlayer() {
    return this.media.closest<HTMLElement>("#movie_player")!;
  }

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

  removePlayerAD(adModule: HTMLElement) {
    const observer = new MutationObserver(() => this.skipAd());
    // 漏网鱼
    this.registerInterval(() => this.skipAd(), 500);
    observer.observe(adModule, { childList: true, subtree: true });
    console.log(`运行去除播放中的广告功能成功`);
  }
  skipAd() {
    const video = this.media;
    const skipButton =
      this.moviePlayer.querySelector<HTMLElement>(`.ytp-ad-skip-button`) ||
      this.moviePlayer.querySelector<HTMLElement>(`.ytp-ad-skip-button-modern`);
    const shortAdMsg = this.moviePlayer.querySelector(
      `.video-ads.ytp-ad-module .ytp-ad-player-overlay`,
    );

    if (!video) return;

    if (skipButton) {
      // 移动端静音有bug
      if (window.location.href.indexOf("https://m.youtube.com/") === -1) {
        video.muted = true;
      }
      if (video.currentTime > 0.5) {
        video.currentTime = video.duration; // 强制
        console.log(`特殊账号跳过按钮广告~~~~~~~~~~~~~`);
        return;
      }
      skipButton.click(); // PC
      nativeTouch.call(skipButton); // Phone
      console.log(`按钮跳过广告~~~~~~~~~~~~~`);
    } else if (shortAdMsg) {
      video.currentTime = video.duration;
      console.log(`强制结束了该广告~~~~~~~~~~~~~`);
    } else {
      console.log(`######广告不存在######`);
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

function nativeTouch(this: HTMLElement) {
  // 创建 Touch 对象
  const touch = new Touch({
    identifier: Date.now(),
    target: this,
    clientX: 12,
    clientY: 34,
    radiusX: 56,
    radiusY: 78,
    rotationAngle: 0,
    force: 1,
  });

  // 创建 TouchEvent 对象
  const touchStartEvent = new TouchEvent(`touchstart`, {
    bubbles: true,
    cancelable: true,
    view: window,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  });

  // 分派 touchstart 事件到目标元素
  this.dispatchEvent(touchStartEvent);

  // 创建 TouchEvent 对象
  const touchEndEvent = new TouchEvent(`touchend`, {
    bubbles: true,
    cancelable: true,
    view: window,
    touches: [],
    targetTouches: [],
    changedTouches: [touch],
  });

  // 分派 touchend 事件到目标元素
  this.dispatchEvent(touchEndEvent);
}
