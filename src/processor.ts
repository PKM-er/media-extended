import MediaExtended from "main";
import { MarkdownPostProcessorContext } from "obsidian";
import {
  ExternalEmbedHandler,
  InternalLinkHandler,
  InternalEmbedHandler,
} from "modules/handlers";
import { mutationParam, filterDuplicates } from "modules/misc";

/** Process internal link to media files with hash */
export function processInternalLinks(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const handler = new InternalLinkHandler(this, ctx);
  const internalLink: mutationParam = {
    // check if link is resolved
    callback: (list, obs) => {
      for (const m of filterDuplicates(list)) {
        const a = m.target as HTMLAnchorElement;
        if (!a.hasClass("is-unresolved")) handler.setTarget(a).handle();
        obs.disconnect();
      }
    },
    option: { attributeFilter: ["class"], attributeOldValue: true },
  };

  for (const link of el.querySelectorAll("a.internal-link")) {
    const ilObs = new MutationObserver(internalLink.callback);
    ilObs.observe(link, internalLink.option);
  }
}

/** Process internal media embeds with hash */
export function processInternalEmbeds(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const allEmbeds = el.querySelectorAll("span.internal-embed");
  if (allEmbeds) {
    const handler = new InternalEmbedHandler(this, ctx);
    const internalEmbed: mutationParam = {
      callback: (list, obs) => {
        for (const mutation of filterDuplicates(list)) {
          const span = mutation.target as HTMLSpanElement;
          if (span.hasClass("is-loaded") && !span.hasClass("mod-empty")) {
            if (span.hasClass("media-embed")) handler.setTarget(span).handle();
            obs.disconnect();
          }
        }
      },
      option: { attributeFilter: ["class"] },
    };

    for (const span of allEmbeds) {
      const ieObs = new MutationObserver(internalEmbed.callback);
      ieObs.observe(span, internalEmbed.option);
    }
  }
}

export function processExternalEmbeds(this: MediaExtended, docEl: HTMLElement) {
  const handler = new ExternalEmbedHandler();
  for (const el of docEl.querySelectorAll("img[referrerpolicy]")) {
    // <img src="" referrerpolicy="no-referrer">
    const img = el as HTMLImageElement;
    handler
      .setTarget(img)
      .doDirectLink()
      ?.doVideoHost(this.settings.thumbnailPlaceholder);
  }
}
