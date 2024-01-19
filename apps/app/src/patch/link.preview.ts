import { around } from "monkey-around";
import type { Plugin, PreviewEventHanlder } from "obsidian";
import { MarkdownPreviewRenderer, Keymap } from "obsidian";
import type { LinkEvent } from "./event";
import { getInstancePrototype } from "./utils";

export default function patchPreviewClick(
  this: Plugin,
  events: Partial<LinkEvent>,
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
  { onExternalLinkClick, onInternalLinkClick }: Partial<LinkEvent>,
  plugin: Plugin,
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
            await onExternalLinkClick(link, paneCreateType !== false, fallback);
          } catch (e) {
            console.error(
              `onExternalLinkClick error in preview, fallback to default`,
              e,
            );
            fallback();
          }
        },
      onInternalLinkClick: (next) =>
        async function (
          this: PreviewEventHanlder,
          evt,
          target,
          linktext,
          ...args
        ) {
          const fallback = () =>
            next.call(this, evt, target, linktext, ...args);
          if (!onInternalLinkClick) return fallback();
          evt.preventDefault();
          const paneCreateType = Keymap.isModEvent(evt);
          const sourcePath = this.info?.file?.path ?? "";
          try {
            await onInternalLinkClick(
              linktext,
              sourcePath,
              paneCreateType !== false,
              fallback,
            );
          } catch (e) {
            console.error(
              `onInternalLinkClick error in preview, fallback to default`,
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
