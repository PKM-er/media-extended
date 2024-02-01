/* eslint-disable @typescript-eslint/naming-convention */
import { Maverick } from "@vidstack/react";
import type {
  MediaContext,
  MediaProviderAdapter,
  MediaSrc,
} from "@vidstack/react";
import type { WebviewTag } from "electron";
import init from "inline:./scripts/initialize";

import { isString } from "maverick.js/std";
import { Notice } from "obsidian";
import type { WebviewElement } from "@/components/webview";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "@/lib/remote-player/const";
import { matchHostForWeb, SupportedWebHost } from "@/web/match-webpage";
import { plugins } from "@/web/plugin";
import { titleParser } from "@/web/title";
import { MessageController, TimeoutError } from "../message";
import { decodeWebpageUrl } from "./encode";
import { HTMLMediaEvents } from "./html–media-events";
import { evalInWebview } from "./lib/inline-eval";
import type { MediaPictureInPictureAdapter } from "./pip";
import { WebpagePictureInPicture } from "./pip";
import type { MsgCtrlLocal } from "./type";

const { createScope, onDispose, scoped } = Maverick;

interface WebviewMediaSrc extends MediaSrc<string> {
  host: SupportedWebHost;
}

export class WebiviewMediaProvider implements MediaProviderAdapter {
  readonly scope = createScope();
  protected $$PROVIDER_TYPE = "WEBVIEW";

  protected _currentSrc: WebviewMediaSrc | null = null;

  protected _port = new MessageController() as MsgCtrlLocal;

  pictureInPicture?: MediaPictureInPictureAdapter;
  constructor(protected _webview: WebviewTag, protected _ctx: MediaContext) {
    scoped(() => {
      this.pictureInPicture = new WebpagePictureInPicture(
        this._port,
        _ctx,
        // don't have whitelist, always require user gesture
        () => this.userGesture(true),
      );
    }, this.scope);
  }

  setup() {
    onDispose(() => {
      // Dispose of media.
      this._webview.src = "";
      // this._webview.reload();
    });
    if (this.type === "webview")
      this._ctx.delegate._notify("provider-setup", this);
    this.registerTitleChange();
    onDispose(() => {
      this._webview.removeEventListener("dom-ready", this.onDomReady);
    });
  }

  get type() {
    return "webview";
  }

  get webview() {
    return this._webview;
  }
  get media() {
    return this._port;
  }

  get currentSrc() {
    return this._currentSrc;
  }
  get currentWebHost(): SupportedWebHost {
    return this._currentSrc?.host ?? SupportedWebHost.Generic;
  }

  setPlaybackRate(rate: number) {
    this._port.methods.setPlaybackRate(rate);
  }

  #interaction: Promise<void> | null = null;
  // autoplay is set to require user gesture in webview,
  // so if not explicitly triggered, play/pause will not work.
  // since userscipt is not eval with "userGesture" being true,
  // we need to trigger a user gesture before play/pause
  async userGesture(force = false) {
    if (!force && this.#interaction) {
      await this.#interaction;
      return;
    }
    await (this.#interaction = this.webview.executeJavaScript("1", true));
  }

  async play() {
    if (this.webview.isConnected) {
      await this.userGesture();
      await this._port.methods.play();
    }
  }

  async pause() {
    if (this.webview.isConnected) {
      await this.userGesture();
      await this._port.methods.pause();
    }
  }

  setMuted(muted: boolean) {
    this._port.methods.setMuted(muted);
  }

  setVolume(volume: number) {
    this._port.methods.setVolume(volume);
  }

  setCurrentTime(time: number) {
    this._port.methods.setCurrentTime(time);
  }

  private get _notify() {
    return this._ctx.delegate._notify;
  }

  private async _updateTitle(event: string | Event, title?: string) {
    const _evt = (event = typeof event === "string" ? new Event(event) : event);
    const originalTitle = title ?? this._webview.getTitle();
    const finalTitle = titleParser[this.currentWebHost](originalTitle);
    const current = this._ctx.$state.title();
    if (finalTitle === current) return;
    this._notify("title-change", finalTitle, _evt);
  }

  loadPlugin(host: SupportedWebHost) {
    return new Promise<void>((resolve, reject) => {
      const webview = this._webview as WebviewElement;
      // #region -- logic to handle plugin load
      const unsub = this.media.onReady(
        async () => {
          window.clearTimeout(timeoutId);
          await this.media.methods.loadPlugin(plugins[host]);
          resolve();
        },
        { once: true },
      );
      const timeoutId = setTimeout(() => {
        unsub();
        reject(new TimeoutError(GET_PORT_TIMEOUT));
      }, GET_PORT_TIMEOUT);
      // #endregion

      const { port1: portLocal, port2: portRemote } = new MessageChannel();
      this._port.load(portLocal);
      webview.contentWindow.postMessage(PORT_MESSAGE, "*", [portRemote]);
    });
  }

  handlePlayReady() {
    const playReady = new Promise<void>((resolve) => {
      const cancel = this._port.once("mx-play-ready", () => {
        resolve();
        window.clearTimeout(timeoutId);
      });
      const timeoutId = window.setTimeout(() => {
        cancel();
        resolve();
        new Notice("Play ready timeout");
      }, 10e3);
    });
    playReady.then(() => {
      this.togglePlayReady(true);
    });
  }

  onDomReady = async (evt: Event) => {
    const webview = this._webview;
    this.handlePlayReady();
    new HTMLMediaEvents(this, this._ctx);
    this._updateTitle(evt);
    // prepare to recieve port, handle plugin load
    await evalInWebview(init, webview);
    await this.loadPlugin(this.currentWebHost);
  };

  registerTitleChange() {
    const webview = this._webview;
    const onPageTitleUpdated = (evt: Electron.PageTitleUpdatedEvent) => {
      this._updateTitle(evt, evt.title);
    };
    webview.addEventListener("page-title-updated", onPageTitleUpdated);
    onDispose(() => {
      webview.removeEventListener("page-title-updated", onPageTitleUpdated);
    });
  }

  togglePlayReady(toggle?: boolean) {
    if (typeof toggle === "undefined") {
      toggle = !("playReady" in this._webview.dataset);
    }
    if (toggle) {
      this._webview.dataset.playReady = "";
    } else {
      delete this._webview.dataset.playReady;
    }
  }

  revokePlayReady?: () => void;

  untilPluginReady() {
    const webview = this._webview;
    this.togglePlayReady(false);
    this.revokePlayReady?.();
    webview.removeEventListener("dom-ready", this.onDomReady);
    return new Promise<void>((resolve, reject) => {
      const onDomReady = (evt: Event) => {
        this.onDomReady(evt).then(resolve).catch(reject);
        webview.removeEventListener("dom-ready", onDomReady);
        webview.addEventListener("dom-ready", this.onDomReady);
      };
      webview.addEventListener("dom-ready", onDomReady);
      this.revokePlayReady = this._port.on("mx-play-ready", () => {
        this.togglePlayReady(true);
      });
    });
  }

  async loadSource({ src: _src, type }: MediaSrc) {
    if (!isString(_src)) {
      throw new Error("Webview provider only supports string src.");
    }
    const src = decodeWebpageUrl(_src);
    const webview = this._webview;
    this._currentSrc = {
      src,
      type,
      host: matchHostForWeb(src)?.type ?? SupportedWebHost.Generic,
    };

    const url = src ? new URL(src) : null;
    const prevUrl = webview.src ? new URL(webview.src) : null;
    if (!url) {
      webview.src = "";
      return;
    }
    if (
      !(url.origin === prevUrl?.origin && url.pathname === prevUrl?.pathname)
    ) {
      webview.src = url.href;
      await this.untilPluginReady();
    }
    // const frag = parseTempFrag(url.hash),
    //   prevFrag = parseTempFrag(prevUrl?.hash);
    // if (!isTempFragEqual(frag, prevFrag)) {
    //   await this.media.methods.setTempFrag(frag);
    //   if (frag && isTimestamp(frag)) {
    //     this.media.methods.setCurrentTime(frag.start);
    //   }
    // }
    // console.log("vidstack player loaded");
  }
}
