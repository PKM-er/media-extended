import type MediaExtended from "@plugin";
import { getInfoFromWarpper, setMediaUrl } from "@slice/set-media";
import { CONTROLS_ENABLED_CLASS, PlayerRenderChild } from "@view";
import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";

import { ElementWithRenderChild } from "./base";

const getEmbedProcessor = (
  type: "internal" | "external",
  plugin: MediaExtended,
): MarkdownPostProcessor => {
  const selector =
    type === "internal"
      ? "span.internal-embed, div.internal-embed"
      : "img[referrerpolicy]";
  return async (secEl, ctx) => {
    for (const warpper of secEl.querySelectorAll<HTMLElement>(selector)) {
      if (type === "internal") {
        handleInternalEmbed(warpper, ctx);
      } else {
        handleExternalEmbed(warpper, ctx, plugin);
      }
    }
  };
};
export default getEmbedProcessor;

const handleInternalEmbed = (
  warpper: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) => {
  warpper.addClass(CONTROLS_ENABLED_CLASS);
  // check if loaded in displayInEl patch,
  // if loaded, add renderChild to post processor ctx
  let observer = new MutationObserver(() => {
    let child;
    if (
      (warpper as HTMLElement).hasClass("is-loaded") &&
      (child = (warpper as ElementWithRenderChild).renderChild)
    ) {
      ctx.addChild(child);
      observer.disconnect();
    }
  });
  observer.observe(warpper, { attributeFilter: ["class"] });
};

const handleExternalEmbed = async (
  warpper: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  plugin: MediaExtended,
) => {
  const info = getInfoFromWarpper(warpper);
  if (!info) return;
  const newWarpper = createSpan({
    cls: ["media-embed", "external-embed", "is-loaded"],
    attr: {
      src: warpper.getAttr("src"),
      alt: warpper.getAttr("alt"),
    },
  });
  warpper.replaceWith(newWarpper);
  const child = new PlayerRenderChild(
    setMediaUrl(info.linktext, info.linkTitle),
    plugin,
    newWarpper,
    false,
  );
  ctx.addChild(child);
  child.load();
};
