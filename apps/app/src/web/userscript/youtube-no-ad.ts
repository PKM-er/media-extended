// hugely inspired by https://greasyfork.org/zh-CN/scripts/4870-maximize-video

/* eslint-disable @typescript-eslint/naming-convention */
import { requireMx } from "./_require";
import YouTubePlugin from "./youtube";

const { waitForSelector } = requireMx();

export default class YouTubePluginNoAd extends YouTubePlugin {
  async onload(): Promise<void> {
    await super.onload();
    waitForSelector<HTMLElement>(".video-ads.ytp-ad-module", this.app).then(
      (adModule) => this.removePlayerAD(adModule),
    );
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
