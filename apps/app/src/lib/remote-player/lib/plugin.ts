import { LifeCycle } from "@/lib/lifecycle";
import { TimeoutError } from "@/lib/message";
import { registerEvents } from "../hook/event-register";
import { registerHandlers } from "../hook/handler-register";
import { handleReadyState } from "../hook/ready-state";
import { fluentTimeUpdate } from "../hook/time-update";
import { mountedEvent, type MsgCtrlRemote } from "../type";
import { waitForSelector } from "./wait-el";
import watchTitle from "./watch-title";

export default class MediaPlugin extends LifeCycle {
  constructor(public controller: MsgCtrlRemote) {
    super();
    this.register(() => controller.unload());
  }

  #media: HTMLMediaElement | null = null;
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("video, audio");
  }

  async load(): Promise<void> {
    await super.load();
    this.controller.send("mx-play-ready", void 0);
  }

  get media() {
    if (!this.#media) {
      throw new Error("Get media before load");
    }
    return this.#media;
  }

  async onload() {
    this.register(watchTitle(this.controller));
    this.#media = await this.findMedia();
    await this.hookMediaEl();
  }

  injectCss(css: string) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    this.register(() => style.remove());
  }

  /**
   * @param state readyState, 1: HAVE_METADATA, 2: HAVE_CURRENT_DATA, 3: HAVE_FUTURE_DATA, 4: HAVE_ENOUGH_DATA
   */
  async untilMediaReady(
    event: keyof typeof readyStateEventMap = "canplay",
    timeout = 5e3,
  ) {
    if (this.media.readyState >= readyStateEventMap[event]) return;
    let timeoutId = -1;
    await new Promise((resolve, reject) => {
      this.registerDomEvent(this.media, event, resolve, { once: true });
      timeoutId = window.setTimeout(() => {
        reject(new TimeoutError(timeout));
      }, timeout);
    });
    window.clearTimeout(timeoutId);
  }

  async hookMediaEl() {
    handleReadyState(this);
    fluentTimeUpdate(this);
    registerEvents(this);
    registerHandlers(this);
    this.controller.send(mountedEvent, void 0);
  }
}

const readyStateEventMap = {
  loadedmetadata: HTMLMediaElement.HAVE_METADATA,
  loadeddata: HTMLMediaElement.HAVE_CURRENT_DATA,
  canplay: HTMLMediaElement.HAVE_FUTURE_DATA,
  canplaythrough: HTMLMediaElement.HAVE_ENOUGH_DATA,
} as const;
