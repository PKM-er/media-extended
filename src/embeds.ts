import { isCssValue } from "@tinyfe/parse-unit";
import MediaExtended from "mx-main";
import { MarkdownPostProcessor } from "obsidian";
import type Plyr from "plyr";

import { setRatioWidth } from "./misc";
import { isAvailable } from "./modules/bili-bridge";
import { setupIFrame } from "./modules/iframe";
import { Host, isHost, isInternal, resolveInfo } from "./modules/media-info";
import { setupPlaceholder } from "./modules/placeholder";
import { getContainer, getPlyr, getSetupTool } from "./modules/plyr-setup";
import { MediaResource } from "./modules/subtitle";

export const getEmbedProcessor = (
  plugin: MediaExtended,
  type: "internal" | "external",
): MarkdownPostProcessor => {
  const selector =
    type === "internal"
      ? "span.internal-embed, div.internal-embed"
      : "img[referrerpolicy]";
  return (secEl, ctx) => {
    secEl.querySelectorAll(selector).forEach(async (el) => {
      const info = await resolveInfo(el, type, plugin.app, ctx);
      if (!info) return;
      const { is } = getSetupTool(info.hash);

      let newEl: HTMLDivElement | null = null;
      const height = plugin.sizeSettings.embedMaxHeight;

      const ratioSetup = (player: Plyr) => setRatio(player, height);
      /**
       * @param placeholder play immediately
       */
      const setPlyr = async (placeholder = false): Promise<HTMLDivElement> => {
        let objectUrls: string[] | undefined = undefined;
        if (isInternal(info)) {
          const trackInfo = await info.updateTrackInfo(plugin.app.vault);
          if (trackInfo) objectUrls = trackInfo.objUrls;
        }
        const hideControls =
          plugin.settings.hideEmbedControls && !is("controls")
            ? { controls: ["play-large"] }
            : undefined;
        const player = getPlyr(info, plugin, hideControls);
        ratioSetup(player);
        if (placeholder)
          player.once("ready", function (evt) {
            this.play();
          });
        const container = getContainer(player);

        ctx.addChild(new MediaResource(container, player, objectUrls));
        return container;
      };

      if (isHost(info)) {
        const {
          thumbnailPlaceholder: placeholder,
          interalBiliPlayback: biliEnabled,
        } = plugin.settings;
        const shouldIframe =
          info.host === Host.bili && (!isAvailable(plugin.app) || !biliEnabled);
        const shouldPlaceholder = placeholder && info.host !== Host.bili;

        const getRealPlayer = async () => {
          if (shouldIframe) return setupIFrame(info);
          else return await setPlyr(shouldPlaceholder);
        };

        if (shouldPlaceholder && !shouldIframe)
          newEl = await setupPlaceholder(info, height, getRealPlayer);
        else newEl = await getRealPlayer();
      } else newEl = await setPlyr();

      if (newEl) {
        const width = el.getAttr("width");
        if (width) {
          newEl.style.width = width + "px";
          newEl.style.minWidth = "0px";
        }
        const height = el.getAttr("height");
        if (height) {
          newEl.style.height = height + "px";
          newEl.style.minHeight = "0px";
        }
        el.replaceWith(newEl);
      }
    });
  };
};

const setRatio = (player: Plyr, maxHeight: string) => {
  if (!isCssValue(maxHeight)) throw new TypeError("maxHeight not css value");

  const container = getContainer(player);
  // @ts-ignore
  if (!player.isVideo) return;

  if (player.isHTML5) {
    container.style.height = maxHeight;
    player.once("canplay", () => {
      const setup = (ratio: string) => {
        const [w, h] = ratio.split(":");
        if (!Number.isInteger(+w) || !Number.isInteger(+h)) {
          console.error("invaild ratio", ratio);
          return;
        }
        // @ts-ignore
        container.style.height = null;
        setRatioWidth(container, maxHeight, +w / +h);
      };
      let count = 0;
      const interval = window.setInterval(() => {
        if (!player.ratio) {
          if (count > 5) {
            console.warn("no ratio", player);
            window.clearInterval(interval);
          } else count++;
        } else {
          window.clearInterval(interval);
          setup(player.ratio);
        }
      }, 200);
    });
  } else {
    player.once("ready", () => {
      setRatioWidth(container, maxHeight, 16 / 9);
    });
  }
};
