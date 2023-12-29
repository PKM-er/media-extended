/* eslint-disable @typescript-eslint/naming-convention */
import { Maverick } from "@vidstack/react";
import type {
  MediaProviderAdapter,
  MediaSetupContext,
  MediaSrc,
} from "@vidstack/react";
import type { WebviewTag } from "electron";
import hookPlayer from "inline:./hosts/generic";
import initPort from "inline:./scripts/init-port";
import watchTitle from "inline:./scripts/watch-title";

import { isString } from "maverick.js/std";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "@/lib/remote-player/const";
import { CommHandler, TimeoutError } from "../comm/handler";
import { HTMLMediaEvents } from "./html–media-events";
import type { CommLocal } from "./type";

const { createScope, onDispose } = Maverick;

export class WebiviewMediaProvider implements MediaProviderAdapter {
  readonly scope = createScope();
  protected $$PROVIDER_TYPE = "WEBVIEW";

  protected _currentSrc: MediaSrc<string> | null = null;

  protected _port = new CommHandler() as CommLocal;

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

  private async _updateTitle(
    event: string | Event,
    titleFetcher?: (original: string) => string,
    title?: string,
  ) {
    const _evt = (event = typeof event === "string" ? new Event(event) : event);
    const originalTitle =
      title ?? (await this._webview.executeJavaScript("document.title"));
    const finalTitle = titleFetcher?.(originalTitle) ?? originalTitle;
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
        this._updateTitle("titlechange", undefined, title);
      }),
    );
    await new Promise<void>((resolve, reject) => {
      webview.addEventListener("dom-ready", async (evt) => {
        new HTMLMediaEvents(this, this._ctx);
        this._updateTitle(evt);
        await webview.executeJavaScript(initPort);
        const { port1: portLocal, port2: portRemote } = new MessageChannel();
        this._port.load(portLocal);
        const unsub = this._port.onReady(
          async () => {
            console.log("PORT READY");
            window.clearTimeout(timeoutId);
            // await target.webview.executeJavaScript(initPlayer);
            await Promise.all(
              [hookPlayer, watchTitle].map((c) =>
                this._webview.executeJavaScript(c),
              ),
            );
            resolve();
          },
          { once: true },
        );
        const timeoutId = setTimeout(() => {
          unsub();
          reject(new TimeoutError(GET_PORT_TIMEOUT));
        }, GET_PORT_TIMEOUT);
        webview.contentWindow.postMessage(PORT_MESSAGE, "*", [portRemote]);
        console.debug("port sent");
      });
      webview.addEventListener("did-navigate", (evt) => {
        this._updateTitle(evt);
      });
    });
    console.log("vidstack player loaded");
  }
}
