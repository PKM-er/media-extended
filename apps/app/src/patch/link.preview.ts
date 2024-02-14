import { around } from "monkey-around";
import type { PreviewEventHanlder } from "obsidian";
import { MarkdownPreviewRenderer, Keymap } from "obsidian";
import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "./event";
import { getInstancePrototype } from "./utils";

export default function patchPreviewClick(
  this: MxPlugin,
  events: Pick<LinkEvent, "onExternalLinkClick">,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const plugin = this;
  const unloadPatchHook = around(
    MarkdownPreviewRenderer as MDPreviewRendererCtor,
    {
      registerDomEvents: (next) =>
        function (this: MarkdownPreviewRenderer, _el, helper, ...args) {
          patchPreviewEventHanlder(helper, events, plugin);
          unloadPatchHook();
          console.debug("preview click patched");
          return next.call(this, _el, helper, ...args);
        },
    },
  );
  plugin.register(unloadPatchHook);
}

function patchPreviewEventHanlder(
  handler: PreviewEventHanlder,
  { onExternalLinkClick }: Pick<LinkEvent, "onExternalLinkClick">,
  plugin: MxPlugin,
) {
  plugin.register(
    around(getInstancePrototype(handler), {
      onExternalLinkClick: (next) =>
        async function (this: PreviewEventHanlder, evt, target, link, ...args) {
          const fallback = () => next.call(this, evt, target, link, ...args);
          if (!onExternalLinkClick) return fallback();
          evt.preventDefault();
          const paneCreateType = Keymap.isModEvent(evt);
          try {
            await onExternalLinkClick.call(
              plugin,
              link,
              paneCreateType === true ? "tab" : paneCreateType,
              fallback,
            );
          } catch (e) {
            console.error(
              `onExternalLinkClick error in preview, fallback to default`,
              e,
            );
            fallback();
          }
        },
    }),
  );
}

declare module "obsidian" {
  class PreviewEventHanlder {
    app: App;
    onInternalLinkDrag(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      linktext: string,
    ): void;
    onInternalLinkClick(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      linktext: string,
    ): void;
    onInternalLinkRightClick(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      linktext: string,
    ): void;
    onExternalLinkClick(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      href: string,
    ): void;
    onInternalLinkMouseover(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      href: string,
    ): void;
    onTagClick(evt: MouseEvent, delegateTarget: HTMLElement, tag: string): void;
    info?: MarkdownView | MarkdownFileInfo;
  }
}

type MDPreviewRendererCtor = typeof MarkdownPreviewRenderer & {
  registerDomEvents(
    el: HTMLElement,
    helper: PreviewEventHanlder,
    isBelongTo: (el: HTMLElement) => boolean,
  ): void;
  belongsToMe(
    target: HTMLElement,
    el: HTMLElement,
    isBelongTo: (el: HTMLElement) => boolean,
  ): boolean;
};
