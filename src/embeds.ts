import MediaExtended from "main";
import { getContainer, getPlyr, getPlyrForHost } from "modules/plyr-setup";
import { SubtitleResource } from "modules/subtitle";
import { setupIFrame } from "modules/iframe";
import { setupPlaceholder } from "modules/placeholder";
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
          const {
            useYoutubeControls: ytControls,
            thumbnailPlaceholder: placeholder,
            interalBiliPlayback: biliEnabled,
          } = plugin.settings;
          // @ts-ignore
          const isMobile: boolean = plugin.app.isMobile;
          const getRealPlayer = () => {
            if (info.host === Host.bili && (isMobile || !biliEnabled))
              return setupIFrame(info);
            else {
              const player = getPlyrForHost(info, ytControls);
              if (placeholder)
                player.once("ready", function (evt) {
                  this.play();
                });
              return getContainer(player);
            }
          };
          if (placeholder) newEl = await setupPlaceholder(info, getRealPlayer);
          else newEl = getRealPlayer();
        }
        if (newEl) el.replaceWith(newEl);
      } catch (error) {
        console.error(error);
      }
    });
  };
};
