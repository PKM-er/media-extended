import { isCssValue } from "@tinyfe/parse-unit";
import MediaExtended from "mx-main";
import { MarkdownPostProcessor } from "obsidian";
import type Plyr from "plyr";

import { setRatioWidth } from "./misc";
import { isAvailable } from "./modules/bili-bridge";
import { setupIFrame } from "./modules/iframe";
import { setupPlaceholder } from "./modules/placeholder";
import { getContainer, getPlyr, getPlyrForHost } from "./modules/plyr-setup";
import { SubtitleResource } from "./modules/subtitle";
import { Host, isDirect, isInternal, resolveInfo } from "./modules/video-info";

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
      const ratioSetup = (player: Plyr) =>
        setRatio(player, plugin.settings.embedHeight);
      const setRegularPlyr = () => {
        const player = getPlyr(info, plugin.app);
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
          embedHeight: height,
        } = plugin.settings;
        const shouldIframe =
          info.host === Host.bili && (!isAvailable(plugin.app) || !biliEnabled);
        const shouldPlaceholder = placeholder && info.host !== Host.bili;
        const getRealPlayer = () => {
          if (shouldIframe) return setupIFrame(info);
          else {
            const player = getPlyrForHost(info, plugin.app, ytControls);
            ratioSetup(player);
            if (shouldPlaceholder)
              player.once("ready", function (evt) {
                this.play();
              });
            return getContainer(player);
          }
        };
        if (shouldPlaceholder && !shouldIframe)
          newEl = await setupPlaceholder(info, height, getRealPlayer);
        else newEl = getRealPlayer();
      }
      if (newEl) el.replaceWith(newEl);
    });
  };
};

const setRatio = (player: Plyr, maxHeight: string) => {
  if (!isCssValue(maxHeight)) throw new TypeError("maxHeight not css value");

  const container = getContainer(player);
  // @ts-ignore
  if (player.type === "video") {
    if (player.isHTML5) {
      container.style.height = maxHeight;
      player.once("canplay", () => {
        if (!player.ratio) {
          console.warn("no ratio", player);
          return;
        }
        const [w, h] = player.ratio.split(":");
        if (!Number.isInteger(+w) || !Number.isInteger(+h)) {
          console.error("invaild ratio", player.ratio);
          return;
        }
        // @ts-ignore
        container.style.height = null;
        setRatioWidth(container, maxHeight, +w / +h);
      });
    } else {
      player.once("ready", () => {
        setRatioWidth(container, maxHeight, 16 / 9);
      });
    }
  }
};
