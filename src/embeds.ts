import MediaExtended from "main";
import { getContainer, getPlyr, getPlyrForHost } from "modules/plyr-setup";
import { SubtitleResource } from "modules/subtitle";
import { setupIFrame } from "modules/iframe";
import { setupPlaceholder } from "modules/placeholder";
import { Host, isDirect, isInternal, resolveInfo } from "modules/video-info";
import { MarkdownPostProcessor } from "obsidian";
import { getIsMobile } from "misc";
import type Plyr from "plyr";

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
        const ratioSetup = (player: Plyr) => setRatio(player, 30, "vh");
        const setRegularPlyr = () => {
          const player = getPlyr(info);
          ratioSetup(player);
          return getContainer(player);
        };

        if (isInternal(info)) {
          newEl = setRegularPlyr();
          ctx.addChild(
            new SubtitleResource(newEl, info.trackInfo?.objUrls ?? []),
          );
        } else if (isDirect(info)) {
          newEl = setRegularPlyr();
        } else {
          const {
            useYoutubeControls: ytControls,
            thumbnailPlaceholder: placeholder,
            interalBiliPlayback: biliEnabled,
          } = plugin.settings;
          const isMobile: boolean = getIsMobile(plugin.app);
          const shouldIframe =
            info.host === Host.bili && (isMobile || !biliEnabled);
          const getRealPlayer = () => {
            if (shouldIframe) return setupIFrame(info);
            else {
              const player = getPlyrForHost(info, ytControls);
              ratioSetup(player);
              if (placeholder)
                player.once("ready", function (evt) {
                  this.play();
                });
              return getContainer(player);
            }
          };
          if (placeholder && !shouldIframe)
            newEl = await setupPlaceholder(info, getRealPlayer);
          else newEl = getRealPlayer();
        }
        if (newEl) el.replaceWith(newEl);
      } catch (error) {
        console.error(error);
      }
    });
  };
};

const setRatio = (player: Plyr, maxHeight: number, unit: string) => {
  const setRatioWidth = (ratio: number) =>
    getContainer(player).style.setProperty(
      "--max-ratio-width",
      maxHeight * ratio + unit,
    );
  if (player.isHTML5)
    player.once("loadedmetadata", () => {
      if (!player.ratio) {
        console.warn("no ratio", player);
        return;
      }
      const [w, h] = player.ratio.split(":");
      if (!Number.isInteger(+w) || !Number.isInteger(+h)) {
        console.error("invaild ratio", player.ratio);
        return;
      }
      setRatioWidth(+w / +h);
    });
  else {
    player.once("ready", () => {
      setRatioWidth(16 / 9);
    });
  }
};
