/* eslint-disable @typescript-eslint/no-this-alias */
import { around } from "monkey-around";
import { createEventEmitter } from "@/lib/emitter";
import { LifeCycle } from "@/lib/lifecycle";
import noop from "@/lib/no-op";

export class XHRIntercepter extends LifeCycle {
  event = createEventEmitter<{
    request: (url: URL, respText: string) => void;
  }>();
  respCache = new Map<string, string>();
  constructor(public filter: (url: URL, method: string) => boolean) {
    super();
  }

  stop: () => void = noop;

  async getRequest(
    predicate?: (url: URL) => boolean,
    timeout = 10e3,
  ): Promise<string> {
    if (this.respCache.size > 0) {
      if (!predicate) {
        const [resp] = this.respCache.values();
        return resp;
      }
      for (const [url, resp] of this.respCache) {
        if (!predicate(new URL(url))) continue;
        return resp;
      }
    }
    return new Promise<string>((resolve, reject) => {
      const off = this.event.on("request", (url, resp) => {
        if (predicate && !predicate(url)) return;
        off();
        window.clearTimeout(timeoutId);
        resolve(resp);
      });
      const timeoutId = window.setTimeout(() => {
        off();
        reject(new Error("XHR timeout"));
      }, timeout);
    });
  }

  async onload() {
    const self = this;
    this.stop = around(XMLHttpRequest.prototype, {
      open: (next) =>
        function (this: XMLHttpRequest, method, _url) {
          const url = new URL(_url, window.location.href);
          if (self.filter(url, method)) {
            promisify(this).then((resp) => {
              self.respCache.set(url.href, resp);
              self.event.emit("request", url, resp);
            });
          }
          // eslint-disable-next-line prefer-rest-params
          return next.apply(this, arguments as any);
        },
    });
  }

  async onunload() {
    this.stop();
    this.respCache.clear();
  }
}

function promisify(req: XMLHttpRequest) {
  return new Promise<string>((resolve, reject) => {
    const onloaded = () => {
      try {
        if (req.status < 200 || req.status >= 400) {
          reject(new Error("Request failed: " + req.status));
          return;
        }
        resolve(req.responseText);
      } catch (e) {
        reject(e);
      }
      req.removeEventListener("error", onerror);
    };
    const onerror = () => {
      reject(new Error("XHR error"));
      req.removeEventListener("load", onloaded);
    };
    req.addEventListener("load", onloaded, { once: true });
    req.addEventListener("error", onerror, { once: true });
  });
}
