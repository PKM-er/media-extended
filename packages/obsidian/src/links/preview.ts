import "obsidian";

import { around } from "monkey-around";
import { EventHelper, Keymap } from "obsidian";
import { MarkdownPreviewRenderer } from "obsidian";

// import { getInternalMediaInfo, getMediaInfo } from "../base/media-info";
// import OpenLink from "../legacy/open-link";
import type MediaExtended from "../mx-main";

type MarkedCtor = typeof EventHelper & { __MX_PATCHED__?: true };
const patchHelper = (plugin: MediaExtended, helper: EventHelper) => {
  const EventHelper = helper.constructor as MarkedCtor;
  if (EventHelper.__MX_PATCHED__) return;

  const unloadPatches = around(EventHelper.prototype, {
    // onExternalLinkClick: (next) =>
    //   function (this: EventHelper, evt, target, link, ...args) {
    //     evt.preventDefault();
    //     const fallback = () => next.call(this, evt, target, link, ...args);
    //     try {
    //       getMediaInfo({ type: "external", link }, this.app).then((info) => {
    //         if (info) OpenLink(info, Keymap.isModEvent(evt), plugin);
    //         else fallback();
    //       });
    //     } catch (error) {
    //       console.error(error);
    //       fallback();
    //     }
    //   },
    // onInternalLinkClick: (next) =>
    //   function (this: EventHelper, evt, target, linktext, ...args) {
    //     evt.preventDefault();
    //     const fallback = () => next.call(this, evt, target, linktext, ...args);
    //     if (!plugin.settings.timestampLink) fallback();
    //     try {
    //       getInternalMediaInfo(
    //         { linktext, sourcePath: this.getFile().path },
    //         this.app,
    //       ).then((info) => {
    //         if (info) OpenLink(info, Keymap.isModEvent(evt), plugin);
    //         else fallback();
    //       });
    //     } catch (error) {
    //       console.error(error);
    //       fallback();
    //     }
    //   },
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
        function (this: MarkdownPreviewRenderer, el, helper, isBelongTo) {
          patchHelper(plugin, helper);
          return next.call(this, el, helper, isBelongTo);
        },
    }),
  );
};
export default patchPreviewLinks;

type MDPreviewRendererCtor = typeof MarkdownPreviewRenderer & {
  registerDomEvents(
    el: HTMLElement,
    helper: EventHelper,
    isBelongTo: (el: HTMLElement) => boolean,
  ): void;
};

declare module "obsidian" {
  class EventHelper {
    app: App;
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
    onTagClick(evt: MouseEvent, delegateTarget: HTMLElement, tag: string): void;
  }
}
