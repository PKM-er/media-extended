import "./style/ratio.less";

import { HashTool, MediaInfoType } from "mx-lib";
import {
  App,
  MarkdownPostProcessor,
  MarkdownPostProcessorContext,
  parseLinktext,
  TFile,
} from "obsidian";
import type Plyr from "plyr";

import { setRatioWidth } from "./misc";
import { isAvailable } from "./modules/bili-bridge";
import { setupIFrame } from "./modules/iframe";
import { getMediaInfo } from "./modules/media-info";
import { isCssValue } from "./modules/parse-unit";
import { setupPlaceholder } from "./modules/placeholder";
import { getContainer, getPlyr } from "./modules/plyr-setup";
import { MediaResource } from "./modules/subtitle";
import MediaExtended from "./mx-main";

const resolveInfo = async (
  el: Element,
  type: "internal" | "external",
  app: App,
  ctx: MarkdownPostProcessorContext,
) => {
  if (type === "internal") {
    const linktext =
      el instanceof HTMLAnchorElement ? el.dataset.href : el.getAttr("src");
    if (!linktext) {
      console.error("no linktext in internal embed: %o, escaping", el);
      return null;
    }
    // resolve linktext, check if exist
    const { subpath: hash, path } = parseLinktext(linktext);
    const file = app.metadataCache.getFirstLinkpathDest(
      path,
      ctx.sourcePath,
    ) as TFile | null;

    return file ? getMediaInfo({ file, hash }, app) : null;
  } else {
    const src = el instanceof HTMLAnchorElement ? el.href : el.getAttr("src");
    if (!src) {
      console.info("fail to get embed src: %o, escaping", el);
      return null;
    } else return getMediaInfo(src, app);
  }
};

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
      const hashTool = new HashTool(info.hash);

      let newEl: HTMLDivElement | null = null;
      const height = plugin.sizeSettings.embedMaxHeight;

      const ratioSetup = (player: Plyr) => setRatio(player, height);
      /**
       * @param placeholder play immediately
       */
      const setPlyr = async (placeholder = false): Promise<HTMLDivElement> => {
        let objectUrls: string[] | undefined = undefined;
        if (info.from === MediaInfoType.Obsidian) {
          const trackInfo = await info.updateTrackInfo();
          if (trackInfo) objectUrls = trackInfo.objUrls;
        }
        const player = getPlyr(info, plugin, (opts) => {
          if (plugin.settings.hideEmbedControls && !hashTool.is("controls"))
            opts.controls = ["play-large"];
        });
        ratioSetup(player);
        if (placeholder)
          player.once("ready", function (evt) {
            this.play();
          });
        const container = getContainer(player);

        ctx.addChild(new MediaResource(container, player, objectUrls));
        return container;
      };

      if (info.from === MediaInfoType.Host) {
        const {
          thumbnailPlaceholder: placeholder,
          interalBiliPlayback: biliEnabled,
        } = plugin.settings;
        const shouldIframe =
          info.host === "bilibili" &&
          (!isAvailable(plugin.app) || !biliEnabled);
        const shouldPlaceholder = placeholder && info.host !== "bilibili";

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
  const DEFAULT_CLASS = "mx-default-height";
  container.style.setProperty("--" + DEFAULT_CLASS, maxHeight);

  if (player.isHTML5) {
    container.addClass(DEFAULT_CLASS);
    player.once("canplay", () => {
      const setup = (ratio: string) => {
        const [w, h] = ratio.split(":");
        if (!Number.isInteger(+w) || !Number.isInteger(+h)) {
          console.error("invaild ratio", ratio);
          return;
        }
        container.removeClass(DEFAULT_CLASS);
        setRatioWidth(container, maxHeight, +w / +h);
      };
      const trySetRatio = (repeat: number, timeout: number, fail: Function) => {
        let count = 0;
        const interval = window.setInterval(() => {
          // @ts-ignore
          if (!player.isVideo) {
            window.clearInterval(interval);
          } else if (!player.ratio) {
            if (count > repeat) {
              fail();
              window.clearInterval(interval);
            } else count++;
          } else {
            window.clearInterval(interval);
            setup(player.ratio);
          }
        }, timeout);
      };
      trySetRatio(10, 100, () => {
        console.log("fail to get ratio within 1s, fallback to 16:9");
        setup("16:9");
        trySetRatio(4, 1e3, () =>
          console.warn("no ratio for video: ", player.source),
        );
      });
    });
  } else {
    player.once("ready", () => {
      setRatioWidth(container, maxHeight, 16 / 9);
    });
  }
};
