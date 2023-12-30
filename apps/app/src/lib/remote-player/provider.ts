/* eslint-disable @typescript-eslint/naming-convention */
import { Maverick } from "@vidstack/react";
import type {
  MediaProviderAdapter,
  MediaSetupContext,
  MediaSrc,
} from "@vidstack/react";
import type { WebviewTag } from "electron";
import init from "inline:./scripts/initialize";

import { isString } from "maverick.js/std";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "@/lib/remote-player/const";
import { matchHost, type SupportedWebHost } from "@/web/match";
import { plugins } from "@/web/plugin";
import { titleParser } from "@/web/title";
import { MessageController, TimeoutError } from "../message";
import { HTMLMediaEvents } from "./html–media-events";
import { evalInWebview } from "./lib/inline-eval";
import type { MsgCtrlLocal } from "./type";

const { createScope, onDispose } = Maverick;

export class WebiviewMediaProvider implements MediaProviderAdapter {
  readonly scope = createScope();
  protected $$PROVIDER_TYPE = "WEBVIEW";

  protected _currentSrc: MediaSrc<string> | null = null;
  protected _currentWebHost: SupportedWebHost = "generic";

  protected _port = new MessageController() as MsgCtrlLocal;

  constructor(protected _webview: WebviewTag) {}

  protected _ctx!: MediaSetupContext;

  setup(ctx: MediaSetupContext) {
    this._ctx = ctx;
    onDispose(() => {
      // Dispose of media.
      this._webview.src = "";
      // this._webview.reload();
    });
    if (this.type === "webview") ctx.delegate._notify("provider-setup", this);
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

  get currentWebHost() {
    return this._currentWebHost;
  }

  setPlaybackRate(rate: number) {
    this._port?.methods.setPlaybackRate(rate);
  }

  async play() {
    this._port?.methods.play();
  }

  async pause() {
    this._port?.methods.pause();
  }

  setMuted(muted: boolean) {
    this._port?.methods.setMuted(muted);
  }

  setVolume(volume: number) {
    this._port?.methods.setVolume(volume);
  }

  setCurrentTime(time: number) {
    this._port?.methods.setCurrentTime(time);
  }

  private get _notify() {
    return this._ctx.delegate._notify;
  }

  private async _updateTitle(event: string | Event, title?: string) {
    const _evt = (event = typeof event === "string" ? new Event(event) : event);
    const originalTitle =
      title ?? (await this._webview.executeJavaScript("document.title"));
    const finalTitle = titleParser[this.currentWebHost](originalTitle);
    const current = this._ctx.$state.title();
    if (finalTitle === current) return;
    this._notify("title-change", finalTitle, _evt);
  }

  async loadSource({ src, type }: MediaSrc) {
    if (!isString(src)) {
      throw new Error("Webview provider only supports string src.");
    }
    const webview = this._webview as WebviewTag & {
      /**
       * @see https://developer.chrome.com/docs/apps/reference/webviewTag?hl=zh-cn#type-ContentWindow
       */
      contentWindow: Window;
    };
    webview.src = src.replace(/^webview::/, "");
    this._currentSrc = { src, type };
    onDispose(
      this._port.on("titlechange", ({ payload: { title } }) => {
        this._updateTitle("titlechange", title);
      }),
    );
    await new Promise<void>((resolve, reject) => {
      webview.addEventListener("dom-ready", async (evt) => {
        this._currentWebHost = matchHost(new URL(webview.src));
        new HTMLMediaEvents(this, this._ctx);
        this._updateTitle(evt);
        // initialize comm port, handle plugin load
        await evalInWebview(init, webview);
        const { port1: portLocal, port2: portRemote } = new MessageChannel();
        this._port.load(portLocal);
        const unsub = this._port.onReady(
          async () => {
            console.log("PORT READY");
            window.clearTimeout(timeoutId);
            await this.media.methods.loadPlugin(plugins[this.currentWebHost]);
            resolve();
          },
          { once: true },
        );
        const timeoutId = setTimeout(() => {
          unsub();
          reject(new TimeoutError(GET_PORT_TIMEOUT));
        }, GET_PORT_TIMEOUT);
        webview.contentWindow.postMessage(PORT_MESSAGE, "*", [portRemote]);
      });
    });

    webview.addEventListener("did-navigate", (evt) => {
      this._updateTitle(evt);
    });
    console.log("vidstack player loaded");
  }
}
