import MediaExtended from "main";
import { getContainer, getPlyr, getPlyrForHost } from "modules/player-setup";
import { SubtitleResource } from "modules/subtitle";
import { setupIFrame } from "modules/iframe";
import { setupThumbnail } from "modules/thumbnail";
import { Host, isDirect, isInternal, resolveInfo } from "modules/video-info";
import { MarkdownPostProcessor } from "obsidian";

export const getEmbedProcessor = (
  plugin: MediaExtended,
  type: "internal" | "external",
): MarkdownPostProcessor => {
  const selector =
    type === "internal" ? "span.internal-embed" : "img[referrerpolicy]";
  return (secEl, ctx) => {
    secEl.querySelectorAll(selector).forEach(async (el) => {
      const info = await resolveInfo(el, type, plugin.app, ctx);
      if (!info) return;

      let newEl: HTMLDivElement | null = null;
      try {
        if (isInternal(info)) {
          newEl = getContainer(getPlyr(info));
          ctx.addChild(
            new SubtitleResource(newEl, info.trackInfo?.objUrls ?? []),
          );
        } else if (isDirect(info)) {
          newEl = getContainer(getPlyr(info));
        } else {
          newEl = createDiv();
          const {
            useYoutubeControls: ytControls,
            thumbnailPlaceholder: thumbnail,
            interalBiliPlayback: biliEnabled,
          } = plugin.settings;
          if (thumbnail) newEl = await setupThumbnail(info, ytControls);
          else if (!biliEnabled && info.host === Host.bili)
            setupIFrame(newEl, info);
          else newEl = getContainer(getPlyrForHost(info, ytControls));
        }
        if (newEl) el.replaceWith(newEl);
      } catch (error) {
        console.error(error);
      }
    });
  };
};
