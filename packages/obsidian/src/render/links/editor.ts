import "obsidian";

import { openMediaFile, openMediaLink } from "@feature/open-media";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { MarkdownView, parseLinktext } from "obsidian";

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
            if (
              "internal-link" === token.type &&
              plugin.settings.timestampLink
            ) {
              const { metadataCache } = this.app,
                { path, subpath: hash } = parseLinktext(token.text),
                file = metadataCache.getFirstLinkpathDest(path, this.file.path);
              if (!file || !openMediaFile(file, hash, true, newLeaf))
                fallback();
            } else if ("external-link" === token.type) {
              if (!openMediaLink(token.text, true, newLeaf)) fallback();
            }
          } catch (error) {
            console.error(error);
            fallback();
          }
        },
    }),
  );
};
