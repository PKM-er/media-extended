import { LifeCycle } from "@/lib/lifecycle";
import { TimeoutError } from "@/lib/message";
import type { VTTContent } from "@/transcript/handle/type";
import { registerEvents } from "../hook/event-register";
import type { MediaStateRef } from "../hook/handler-register";
import { registerHandlers } from "../hook/handler-register";
import { handleReadyState } from "../hook/ready-state";
import { fluentTimeUpdate } from "../hook/time-update";
import { mountedEvent, type MsgCtrlRemote } from "../interface";
import { waitForSelector } from "./wait-el";

const generalPlayerRules = [
  ".dplayer",
  ".video-js",
  ".jwplayer",
  "[data-player]",
];

export default class MediaPlugin extends LifeCycle {
  constructor(public controller: MsgCtrlRemote) {
    super();
    this.register(() => controller.unload());
  }

  async getTrack(_id: string): Promise<VTTContent | null> {
    return null;
  }

  getStyle(): string | null {
    return css;
  }

  #media: HTMLMediaElement | null = null;
  protected stateRef: MediaStateRef = { prevSeek: null };
  findMedia(): Promise<HTMLMediaElement> {
    return waitForSelector<HTMLMediaElement>("video, audio");
  }

  async load(): Promise<void> {
    const style = this.getStyle();
    if (style) {
      this.injectStyle(style);
    }
    await super.load();
    const isNativePlayer = this.media.controls === true;
    if (isNativePlayer) this.media.controls = false;
    this.register(
      this.controller.on("mx-toggle-controls", ({ payload: showWebsite }) => {
        document.body.classList.toggle("mx-show-controls", showWebsite);
      }),
    );
    if (isNativePlayer) {
      this.register(
        this.controller.on("mx-toggle-controls", ({ payload: showWebsite }) => {
          this.media.controls = showWebsite;
        }),
      );
    }
    this.register(
      this.controller.on("mx-toggle-webfs", ({ payload: enableWebFs }) => {
        document.body.classList.toggle("mx-fs-enable", enableWebFs);
      }),
    );
    document.body.classList.add("mx-play-ready");
    this.controller.send("mx-play-ready", void 0);
    console.log("sent play ready");
  }

  get media() {
    if (!this.#media) {
      throw new Error("Get media before load");
    }
    return this.#media;
  }

  async onload() {
    this.#media = await this.findMedia();
    console.log("found media");
    await Promise.all([this.enterWebFullscreen(), this.hookMediaEl()]);
    console.log("media hooked");
  }

  enterWebFullscreen(): any {
    document.body.classList.add("mx-fs-enable");
    const container =
      this.media.closest<HTMLElement>(generalPlayerRules.join(", ")) ??
      this.media;
    container.classList.add("mx-player");
    this.assignParentClass(container);
    window.dispatchEvent(new Event("resize"));
  }

  assignParentClass(target: HTMLElement) {
    for (const parent of parents(target)) {
      parent.classList.add("mx-parent");
      if (getComputedStyle(parent).position == "fixed") {
        parent.classList.add("mx-absolute");
      }
    }
  }

  injectStyle(css: string) {
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

  rehookMediaEl(media: HTMLMediaElement) {
    this.#media = media;
    this.hookMediaEl();
  }

  async hookMediaEl() {
    handleReadyState(this);
    fluentTimeUpdate(this);
    registerEvents(this);
    registerHandlers.call(this);
    this.controller.send(mountedEvent, void 0);
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

const readyStateEventMap = {
  loadedmetadata: HTMLMediaElement.HAVE_METADATA,
  loadeddata: HTMLMediaElement.HAVE_CURRENT_DATA,
  canplay: HTMLMediaElement.HAVE_FUTURE_DATA,
  canplaythrough: HTMLMediaElement.HAVE_ENOUGH_DATA,
} as const;

const css = `
body.mx-fs-enable .mx-player {
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
body.mx-fs-enable .mx-parent {
  overflow: visible !important;
  z-index: auto !important;
  transform: none !important;
  -webkit-transform-style: flat !important;
  transition: none !important;
  contain: none !important;
}
body.mx-fs-enable .mx-absolute {
  position: absolute !important;
}
body.mx-fs-enable {
  overflow: hidden !important;
  zoom: 100% !important;
}
body.mx-fs-enable .mx-parent video {
  object-fit: contain !important;
}
`.trim();
