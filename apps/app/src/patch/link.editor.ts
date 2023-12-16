import "obsidian";

import type MediaExtended from "@/mx-main";
import { around } from "monkey-around";
import { MarkdownEditView } from "obsidian";
import { getInstancePrototype, getMarkdownViewInstance } from "./utils";
import { LinkEvent } from "./event";

declare module "obsidian" {
  interface MarkdownEditView {
    triggerClickableToken(
      token: { type: string; text: string; start: number; end: number },
      newLeaf: boolean
    ): void;
  }
  interface MarkdownView {
    // for safe access
    editMode?: MarkdownEditView;
  }
}

export default function patchEditorClick(
  plugin: MediaExtended,
  { onExternalLinkClick, onInternalLinkClick }: Partial<LinkEvent>
) {
  return getMarkdownViewInstance(plugin).then((view) => {
    if (!view.editMode) {
      console.error(
        "MarkdownView.editMode is not available, cannot patch editor click"
      );
      return;
    }
    plugin.register(
      around(getInstancePrototype(view.editMode), {
        triggerClickableToken: (next) =>
          function (this: MarkdownEditView, token, newLeaf, ...args) {
            const fallback = () => next.call(this, token, newLeaf, ...args);
            if ("internal-link" === token.type && onInternalLinkClick) {
              onInternalLinkClick(
                token.text,
                this.file.path,
                newLeaf,
                fallback
              );
            } else if ("external-link" === token.type && onExternalLinkClick) {
              onExternalLinkClick(token.text, newLeaf, fallback);
            } else fallback();
          },
      })
    );
    console.debug("editor click patched");
  });
}
