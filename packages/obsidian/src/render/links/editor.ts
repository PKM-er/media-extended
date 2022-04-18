import "obsidian";

import { openMediaLink } from "@feature/open-link";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { MarkdownView } from "obsidian";

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
            if (!("external-link" === token.type && openMediaLink(token.text)))
              fallback();
          } catch (error) {
            console.error(error);
            fallback();
          }
        },
    }),
  );
};
