import "obsidian";

import {
  openMediaFile,
  openMediaLink,
  openMediaLinkInHoverEditor,
} from "@feature/open-media";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { EventHelper, Keymap, parseLinktext } from "obsidian";
import { MarkdownPreviewRenderer } from "obsidian";

import { onExternalLinkClick, onInternalLinkClick } from "./common";

type MarkedCtor = typeof EventHelper & { __MX_PATCHED__?: true };
const patchHelper = (plugin: MediaExtended, helper: EventHelper) => {
  const EventHelper = helper.constructor as MarkedCtor;
  if (EventHelper.__MX_PATCHED__) return;

  const unloadPatches = around(EventHelper.prototype, {
    onExternalLinkClick: (next) =>
      function (this: EventHelper, evt, target, link, ...args) {
        evt.preventDefault();
        onExternalLinkClick(link, Keymap.isModEvent(evt), () =>
          next.call(this, evt, target, link, ...args),
        );
      },
    onInternalLinkClick: (next) =>
      function (this: EventHelper, evt, target, linktext, ...args) {
        evt.preventDefault();
        onInternalLinkClick(
          linktext,
          this.getFile().path,
          Keymap.isModEvent(evt),
          () => next.call(this, evt, target, linktext, ...args),
          plugin,
        );
      },
    mx_onExternalLinkMouseover: (next) =>
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      function (this: EventHelper, evt, target, url, ...args) {
        evt.preventDefault();
        if (!plugin.settings.extendedImageEmbedSyntax) return;
        try {
          openMediaLinkInHoverEditor(url, target, evt);
        } catch (error) {
          console.error(error);
        }
      },
  });
  plugin.register(() => {
    delete EventHelper.__MX_PATCHED__;
    unloadPatches();
  });

  EventHelper.__MX_PATCHED__ = true;
};

const patchPreviewLinks = (plugin: MediaExtended) => {
  plugin.register(
    around(MarkdownPreviewRenderer as MDPreviewRendererCtor, {
      registerDomEvents: (next) =>
        function (
          this: MarkdownPreviewRenderer,
          el,
          helper,
          isBelongTo,
          ...args
        ) {
          patchHelper(plugin, helper);
          const result = next.call(this, el, helper, isBelongTo, ...args);

          const getLinktext = (target: HTMLElement) => {
            const href = target.getAttr("data-href") || target.getAttr("href");
            return href &&
              (MarkdownPreviewRenderer as MDPreviewRendererCtor).belongsToMe(
                target,
                el,
                isBelongTo,
              )
              ? href
              : null;
          };
          const handler = (evt: MouseEvent, el: HTMLElement) => {
            const linktext = getLinktext(el);
            linktext && helper.mx_onExternalLinkMouseover(evt, el, linktext);
          };
          el.on("mouseover", "a.external-link", handler);
          plugin.register(() =>
            el.off("mouseover", "a.external-link", handler),
          );
          return result;
        },
    }),
  );
  // if layout is ready on load,
  // reload all existing markdown view for patch to work
  if (null === (app.workspace as any).onLayoutReadyCallbacks) {
    Promise.all(
      app.workspace.getLeavesOfType("markdown").map(async (leaf) => {
        const state = leaf.getViewState();
        await leaf.setViewState({ type: "empty" });
        await leaf.setViewState(state);
      }),
    ); //.then(() => console.log("Markdown previews are reloaded"));
  }
};
export default patchPreviewLinks;

type MDPreviewRendererCtor = typeof MarkdownPreviewRenderer & {
  registerDomEvents(
    el: HTMLElement,
    helper: EventHelper,
    isBelongTo: (el: HTMLElement) => boolean,
  ): void;
  belongsToMe(
    target: HTMLElement,
    el: HTMLElement,
    isBelongTo: (el: HTMLElement) => boolean,
  ): boolean;
};

declare module "obsidian" {
  class EventHelper {
    app: App;
    hoverParent: HTMLElement;
    getFile(): TFile;
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
    mx_onExternalLinkMouseover(
      evt: MouseEvent,
      delegateTarget: HTMLElement,
      href: string,
    ): void;
    onTagClick(evt: MouseEvent, delegateTarget: HTMLElement, tag: string): void;
  }
}
