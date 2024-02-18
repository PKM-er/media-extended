import { around } from "monkey-around";
import type { MarkdownEditView } from "obsidian";

import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "./event";
import { toPaneAction } from "./mod-evt";
import { getInstancePrototype, getRunningViewInstance } from "./utils";

declare module "obsidian" {
  interface MarkdownEditView {
    triggerClickableToken(
      token: { type: string; text: string; start: number; end: number },
      newLeaf: boolean | PaneType,
    ): void;
  }
  interface MarkdownView {
    // for safe access
    editMode?: MarkdownEditView;
  }
}

export default function patchEditorClick(
  this: MxPlugin,
  { onExternalLinkClick }: Pick<LinkEvent, "onExternalLinkClick">,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const plugin = this;
  return getRunningViewInstance("markdown", plugin).then((view) => {
    if (!view.editMode) {
      console.error(
        "MarkdownView.editMode is not available, cannot patch editor click",
      );
      return;
    }
    plugin.register(
      around(getInstancePrototype(view.editMode), {
        triggerClickableToken: (next) =>
          async function (this: MarkdownEditView, token, newLeaf, ...args) {
            const fallback = () => next.call(this, token, newLeaf, ...args);
            // if (onInternalLinkClick && "internal-link" === token.type) {
            //   try {
            //     await onInternalLinkClick(
            //       token.text,
            //       this.file.path,
            //       newLeaf,
            //       fallback,
            //     );
            //   } catch (e) {
            //     console.error(
            //       `onInternalLinkClick error in editor, fallback to default`,
            //       e,
            //     );
            //     fallback();
            //   }
            // } else
            if (onExternalLinkClick && "external-link" === token.type) {
              try {
                await onExternalLinkClick.call(
                  plugin,
                  token.text,
                  toPaneAction(newLeaf),
                  fallback,
                );
              } catch (e) {
                console.error(
                  `onExternalLinkClick error in editor, fallback to default`,
                  e,
                );
                fallback();
              }
            } else fallback();
          },
      }),
    );
    console.debug("editor click patched");
  });
}
