import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";

// import { getMediaInfo } from "../base/media-info";
// import getPlayer from "../legacy/get-player";
import { CONTROLS_ENABLED_CLASS } from "../media-view";
import type MediaExtended from "../mx-main";
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
    for (const warpper of secEl.querySelectorAll(selector)) {
      if (type === "internal") {
        handleInternalEmbed(warpper, ctx);
      } else {
        // handleExternalEmbed(warpper, ctx, plugin);
      }
    }
  };
};
export default getEmbedProcessor;

const handleInternalEmbed = (
  warpper: Element,
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

// const handleExternalEmbed = async (
//   warpper: Element,
//   ctx: MarkdownPostProcessorContext,
//   plugin: MediaExtended,
// ) => {
//   const elToGetInfo = warpper as HTMLImageElement;
//   const src = elToGetInfo.src;
//   if (!src) return;
//   const info = await getMediaInfo({ type: "external", link: src }, plugin.app);
//   if (!info) return;
//   const [playerEl, children] = await getPlayer(info, elToGetInfo, plugin);
//   children.forEach(ctx.addChild.bind(ctx));
//   elToGetInfo.replaceWith(
//     createSpan(
//       {
//         cls: ["media-embed", "external-embed", "is-loaded"],
//         attr: {
//           src: elToGetInfo.getAttr("src"),
//           alt: elToGetInfo.getAttr("alt"),
//         },
//       },
//       (span) => span.append(playerEl),
//     ),
//   );
// };
