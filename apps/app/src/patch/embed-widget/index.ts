import { around } from "monkey-around";
import type { Plugin } from "obsidian";
import type MediaExtended from "@/mx-main";
import "./embed-patch.global.css";

import defineStatefulDecoration from "./state";

export default function setupEmbedWidget(plugin: MediaExtended) {
  plugin.registerEditorExtension(defineStatefulDecoration(plugin));
  imgErrorDataLabel(plugin);
}

const cmClasses = ["cm-line", "cm-content"];
const errorLabel = "mxError";
function isParentCm(el: HTMLElement) {
  if (!el.parentElement) return false;
  const parent = el.parentElement;
  return cmClasses.some((cls) => parent.classList.contains(cls));
}
function onError(this: HTMLImageElement) {
  if (!isParentCm(this)) return;
  this.dataset[errorLabel] = "";
  this.removeEventListener("load", onLoad);
}
function onLoad(this: HTMLImageElement) {
  if (!isParentCm(this)) return;
  delete this.dataset[errorLabel];
  this.removeEventListener("error", onError);
}
function imgErrorDataLabel(plugin: Plugin) {
  plugin.register(
    around(window, {
      // @ts-ignore
      createEl: (next) =>
        function () {
          // @ts-ignore
          // eslint-disable-next-line prefer-rest-params
          const el = next.apply(this, arguments);

          if (el instanceof HTMLImageElement) {
            el.addEventListener("error", onError, { once: true });
            el.addEventListener("load", onLoad, { once: true });
          }
          return el;
        },
    }),
  );
}
