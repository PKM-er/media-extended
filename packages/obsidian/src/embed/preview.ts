import { MarkdownPostProcessor } from "obsidian";

import { getMediaInfo } from "../base/media-info";
import { CONTROLS_ENABLED_CLASS } from "../media-view-v2";
import type MediaExtended from "../mx-main";
import { ElementWithRenderChild } from "./base";
import getPlayer from "./get-player";

const getEmbedProcessor = (
  type: "internal" | "external",
  plugin: MediaExtended,
): MarkdownPostProcessor => {
  const selector =
    type === "internal"
      ? "span.internal-embed, div.internal-embed"
      : "img[referrerpolicy]";
  return async (secEl, ctx) => {
    for (const warpper of secEl.querySelectorAll(selector)) {
      if (type === "internal") {
        warpper.addClass(CONTROLS_ENABLED_CLASS);
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
      } else {
        const elToGetInfo = warpper as HTMLImageElement;
        const src = elToGetInfo.src;
        if (!src) return;
        const info = await getMediaInfo(src, plugin.app);
        if (!info) return;
        const [playerEl, children] = await getPlayer(info, elToGetInfo, plugin);
        children.forEach(ctx.addChild.bind(ctx));
        elToGetInfo.replaceWith(
          createSpan(
            {
              cls: ["media-embed", "external-embed", "is-loaded"],
              attr: {
                src: elToGetInfo.getAttr("src"),
                alt: elToGetInfo.getAttr("alt"),
              },
            },
            (span) => span.append(playerEl),
          ),
        );
      }
    }
  };
};
export default getEmbedProcessor;
