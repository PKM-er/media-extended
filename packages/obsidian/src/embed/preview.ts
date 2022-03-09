import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";

import { getMediaInfo, getInternalMediaInfo } from "../modules/media-info";
import type MediaExtended from "../mx-main";
import getPlayer from "./get-player";

const getEmbedProcessor = (
  type: "internal" | "external",
  plugin: MediaExtended,
): MarkdownPostProcessor => {
  const selector =
    type === "internal"
      ? "span.internal-embed, div.internal-embed"
      : "img[referrerpolicy]";
  const getInfoFromEl: (
    warpper: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => ReturnType<typeof getMediaInfo> =
    type === "internal"
      ? async (el, ctx) => {
          const linktext = el.getAttr("src");
          if (!linktext) return null;
          return getInternalMediaInfo(
            { linktext, sourcePath: ctx.sourcePath },
            plugin.app,
          );
        }
      : async (el) => {
          const src = (el as HTMLImageElement).src;
          if (!src) return null;
          return getMediaInfo(src, plugin.app);
        };
  return async (secEl, ctx) => {
    for (const warpper of secEl.querySelectorAll(selector)) {
      const elToGetInfo = warpper as HTMLElement;

      const info = await getInfoFromEl(elToGetInfo, ctx);
      if (!info) return;
      const [playerEl, children] = await getPlayer(info, elToGetInfo, plugin);
      children.forEach(ctx.addChild.bind(ctx));
      if (type === "internal") {
        elToGetInfo.empty();
        elToGetInfo.append(playerEl);
      } else {
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
