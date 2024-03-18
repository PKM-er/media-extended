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
import { ButtonComponent, Notice } from "obsidian";
import type { WebviewElement } from "@/components/webview";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "@/lib/remote-player/const";
import { LoginModal } from "@/login/modal";
import { plugins } from "@/web/plugin";
import { titleParser } from "@/web/title";
import { MediaURL } from "@/web/url-match";
import { MediaHost } from "@/web/url-match/supported";
import { MessageController, TimeoutError } from "../message";
import { noHash } from "../url";
import { decodeWebpageUrl } from "./encode";
import { HTMLMediaEvents } from "./html–media-events";
import { evalInWebview } from "./lib/inline-eval";
import { WebviewLoadError, webviewErrorMessage } from "./net-err";
import type { MediaPictureInPictureAdapter } from "./pip";
import { WebpagePictureInPicture } from "./pip";
import type { MsgCtrlLocal } from "./type";

const { createScope, onDispose, scoped } = Maverick;

interface WebviewMediaSrc extends MediaSrc<string> {
  host: MediaHost;
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
    notifyLogin();
    if (this.type === "webview")
      this._ctx.delegate._notify("provider-setup", this);
    this.registerTitleChange();
    onDispose(() => {
      this._webview.removeEventListener("dom-ready", this.onDomReady);
    });
    onDispose(
      this._port.on("mx-open-browser", ({ payload: { url, message = "" } }) => {
        noticeWithOK({
          message: message + `Open ${url} in login browser?`,
          cancelText: "No",
          onConfirm: () => {
            // eslint-disable-next-line deprecation/deprecation
            const modal = new LoginModal(app);
            modal.open();
            modal.setUrl(url);
          },
        });
      }),
    );
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
  get currentWebHost(): MediaHost {
    return this._currentSrc?.host ?? MediaHost.Generic;
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
    await (this.#interaction = this.webview
      .executeJavaScript("1", true)
      .finally(() => {
        this.#interaction = null;
      }));
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

  loadPlugin(host: MediaHost) {
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
    const finishLoad = new Promise<void>((_resolve, _reject) => {
      const unload = () => {
        this.webview.removeEventListener("did-stop-loading", resolve);
        this.webview.removeEventListener("did-finish-load", resolve);
        this.webview.removeEventListener("did-fail-load", reject);
      };
      const resolve = () => {
        _resolve();
        unload();
      };
      const reject = (evt: Electron.DidFailLoadEvent) => {
        _reject(new WebviewLoadError(evt));
        unload();
      };
      this.webview.addEventListener("did-stop-loading", resolve);
      this.webview.addEventListener("did-finish-load", resolve);
      this.webview.addEventListener("did-fail-load", reject);
    });
    let timeoutId: number;
    const timeout = (ms: number) =>
      new Promise<void>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new TimeoutError(ms)), ms);
      });
    const playReady = new Promise<void>((resolve) => {
      this._port.once("mx-play-ready", () => {
        resolve();
        window.clearTimeout(timeoutId);
      });
    });

    const timeoutLimit = 10e3;
    finishLoad
      .then(() => {
        return Promise.race([playReady, timeout(timeoutLimit)]);
      })
      .then(() => {
        this.togglePlayReady(true);
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          timeoutNotice(timeoutLimit);
        } else if (err instanceof WebviewLoadError) {
          const desc = webviewErrorMessage(err);
          new Notice(
            createFragment((el) => {
              el.appendText(`Failed to load webpage: ${desc}`);
              el.createEl("p", { text: "Click to copy " }, (p) =>
                p.createEl(
                  "a",
                  {
                    href: err.url,
                    text:
                      err.url.length > 50
                        ? `${err.url.substring(0, 50)}...`
                        : err.url,
                  },
                  (a) => {
                    a.addEventListener("click", (e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(err.url);
                      new Notice("URL copied to clipboard.");
                    });
                  },
                ),
              );
            }),
          );
        } else {
          throw err;
        }
      })
      .finally(() => {
        this.togglePlayReady(true);
      });
  }

  onDomReady = async (evt: Event) => {
    const webview = this._webview;
    new HTMLMediaEvents(this, this._ctx);
    Maverick.effect(() => {
      if (this._ctx.$state.autoPlay()) {
        this.userGesture();
      }
    });
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

  untilPluginReady() {
    const webview = this._webview;
    this.togglePlayReady(false);
    webview.removeEventListener("dom-ready", this.onDomReady);
    this.handlePlayReady();
    return new Promise<void>((resolve, reject) => {
      const onDomReady = (evt: Event) => {
        this.onDomReady(evt).then(resolve).catch(reject);
        webview.removeEventListener("dom-ready", onDomReady);
        webview.addEventListener("dom-ready", this.onDomReady);
      };
      webview.addEventListener("dom-ready", onDomReady);
    });
  }

  async loadSource({ src: _src, type }: MediaSrc) {
    if (!isString(_src)) {
      throw new Error("Webview provider only supports string src.");
    }
    const url = MediaURL.create(decodeWebpageUrl(_src));
    const webview = this._webview;
    this._currentSrc = {
      src: url?.source.href ?? "",
      type,
      host: url?.type ?? MediaHost.Generic,
    };

    if (!url) {
      webview.src = "";
      return;
    }
    const shouldReload =
      !webview.src || noHash(url.source) !== noHash(webview.src);
    webview.src = url.href;
    if (shouldReload) await this.untilPluginReady();
  }
}

function notifyLogin() {
  const label = "mx:webview-login-notified";
  const notified = localStorage.getItem(label);
  if (notified) return;
  new Notice(
    createFragment((e) => {
      e.appendText("You're using a webpage media player.");
      e.createEl(
        "p",
        {
          text: "If you are requested to login, you can open a browser to login from:",
        },
        (p) => {
          p.createEl("br");
          p.appendText('- the "Login" command');
          p.createEl("br");
          p.appendText("- the entry in settings tab");
        },
      );
      e.appendText("Click to dismiss this notice.");
    }),
    0,
  );
  localStorage.setItem(label, "1");
}

function timeoutNotice(timeout: number) {
  const label = "mx:webview-timeout-ignore";
  const ignore = localStorage.getItem(label);
  if (ignore) return;
  const timeoutLabel = (timeout / 1e3).toFixed(1);
  noticeWithOK({
    message: `Webpage not fully loaded within ${timeoutLabel}s. You can still try to play.`,
    onCancel() {
      console.log("ignore webview timeout notice");
      localStorage.setItem(label, "1");
    },
    cancelText: "Don't show again",
    timeout: 5e3,
  });
}

function noticeWithOK({
  message,
  cancelText = "Ignore",
  confirmText = "OK",
  onConfirm,
  onCancel,
  timeout,
}: {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => any;
  onCancel?: () => any;
  timeout?: number;
}) {
  const notice = new Notice(
    createFragment((e) => {
      e.createDiv({ text: message });
      e.createDiv({}, (div) => {
        div.style.display = "flex";
        div.style.justifyContent = "flex-end";
        div.style.gap = "1em";
        div.style.marginTop = "1em";
        const ok = new ButtonComponent(div).setButtonText(confirmText);
        if (onConfirm) {
          ok.onClick(async () => {
            await onConfirm();
            notice.hide();
          });
        }
        const cancel = new ButtonComponent(div).setButtonText(cancelText);
        if (onCancel) {
          cancel.onClick(async () => {
            await onCancel();
            notice.hide();
          });
        }
      });
    }),
    timeout,
  );
  return notice;
}
