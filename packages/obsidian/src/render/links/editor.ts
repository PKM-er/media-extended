import "obsidian";

import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { MarkdownView } from "obsidian";

import { onExternalLinkClick, onInternalLinkClick } from "./common";

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
          if ("internal-link" === token.type) {
            onInternalLinkClick(
              token.text,
              this.file.path,
              newLeaf,
              fallback,
              plugin,
            );
          } else if ("external-link" === token.type) {
            onExternalLinkClick(token.text, newLeaf, fallback);
          }
        },
    }),
  );
};
