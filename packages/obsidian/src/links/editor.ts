import "obsidian";

import { around } from "monkey-around";
import { MarkdownView } from "obsidian";

// import { getInternalMediaInfo, getMediaInfo } from "../base/media-info";
// import OpenLink from "../legacy/open-link";
import type MediaExtended from "../mx-main";

declare module "obsidian" {
  interface MarkdownView {
    triggerClickableToken(
      token: { type: string; text: string; start: number; end: number },
      newLeaf: boolean,
    ): void;
  }
}

export const patchEditorClick = (plugin: MediaExtended) => {
  plugin.register(
    around(MarkdownView.prototype, {
      triggerClickableToken: (next) =>
        function (this: MarkdownView, token, newLeaf, ...args) {
          const fallback = () => next.call(this, token, newLeaf, ...args);
          try {
            /* if (
              "internal-link" === token.type &&
              plugin.settings.timestampLink
            ) {
              getInternalMediaInfo(
                { linktext: token.text, sourcePath: this.file.path },
                this.app,
              ).then((info) => {
                if (info) OpenLink(info, newLeaf, plugin);
                else fallback();
              });
            } else  */ /* if ("external-link" === token.type) {
              getMediaInfo(
                { type: "external", link: token.text },
                this.app,
              ).then((info) => {
                if (info) OpenLink(info, newLeaf, plugin);
                else fallback();
              });
            } else */ fallback();
          } catch (error) {
            console.error(error);
            fallback();
          }
        },
    }),
  );
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
