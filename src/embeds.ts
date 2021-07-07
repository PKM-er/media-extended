import assertNever from "assert-never";
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
          newEl = createDiv({ cls: "external-video" });
          const {
            useYoutubeControls: ytControls,
            thumbnailPlaceholder: thumbnail,
          } = plugin.settings;
          if (thumbnail) setupThumbnail(newEl, info, ytControls);
          else
            switch (info.host) {
              case Host.youtube:
              case Host.vimeo:
                newEl = getContainer(getPlyrForHost(info, ytControls));
                break;
              case Host.bili:
                setupIFrame(newEl, info);
                break;
              default:
                assertNever(info.host);
            }
        }
        if (newEl) el.replaceWith(newEl);
      } catch (error) {
        console.error(error);
      }
    });
  };
};
