import "obsidian";

import parseURL from "@base/url-parse";
import { openMediaFile, openMediaLink } from "@feature/open-media";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { EventHelper, Keymap, parseLinktext } from "obsidian";
import { MarkdownPreviewRenderer } from "obsidian";

type MarkedCtor = typeof EventHelper & { __MX_PATCHED__?: true };
const patchHelper = (plugin: MediaExtended, helper: EventHelper) => {
  const EventHelper = helper.constructor as MarkedCtor;
  if (EventHelper.__MX_PATCHED__) return;

  const unloadPatches = around(EventHelper.prototype, {
    onExternalLinkClick: (next) =>
      function (this: EventHelper, evt, target, link, ...args) {
        evt.preventDefault();
        const fallback = () => next.call(this, evt, target, link, ...args);
        try {
          if (!openMediaLink(link, Keymap.isModEvent(evt))) fallback();
        } catch (error) {
          console.error(error);
          fallback();
        }
      },
    onInternalLinkClick: (next) =>
      function (this: EventHelper, evt, target, linktext, ...args) {
        evt.preventDefault();
        const fallback = () => next.call(this, evt, target, linktext, ...args);
        if (!plugin.settings.timestampLink) return fallback();
        try {
          const { metadataCache } = this.app,
            { path, subpath: hash } = parseLinktext(linktext),
            file = metadataCache.getFirstLinkpathDest(
              path,
              this.getFile().path,
            );
          if (!file || !openMediaFile(file, hash, Keymap.isModEvent(evt)))
            fallback();
        } catch (error) {
          console.error(error);
          fallback();
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
