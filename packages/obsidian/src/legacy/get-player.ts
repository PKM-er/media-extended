// @ts-nocheck
import "../style/ratio.less";

import { HashTool, HostMediaInfo, MediaInfoType } from "mx-lib";
import { MarkdownRenderChild } from "obsidian";
import type Plyr from "plyr";

import { MediaInfo } from "../base/media-info";
import { isAvailable } from "../feature/bili-bridge";
import { setRatioWidth } from "../misc";
import { isCssValue } from "../modules/parse-unit";
import type MediaExtended from "../mx-main";
import { setupPlaceholder } from "./placeholder";
import { getContainer, getPlyr } from "./plyr-setup";
import { MediaResource } from "./subtitle";

const getPlayer = async (
  info: MediaInfo,
  ogWarpper: HTMLElement,
  plugin: MediaExtended,
): Promise<[playerEl: HTMLElement, children: MarkdownRenderChild[]]> => {
  const hashTool = new HashTool(info.hash);

  let renderChildren: MarkdownRenderChild[] = [];

  let playerEl: HTMLDivElement | null = null;
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
    renderChildren.push(new MediaResource(container, player, objectUrls));
    return container;
  };

  if (info.from === MediaInfoType.Host) {
    const {
      thumbnailPlaceholder: placeholder,
      interalBiliPlayback: biliEnabled,
    } = plugin.settings;
    const shouldIframe =
      info.host === "bilibili" && (!isAvailable(plugin.app) || !biliEnabled);
    const shouldPlaceholder = placeholder && info.host !== "bilibili";

    const getRealPlayer = async () => {
      if (shouldIframe) return setupIFrame(info);
      else return await setPlyr(shouldPlaceholder);
    };

    if (shouldPlaceholder && !shouldIframe)
      playerEl = await setupPlaceholder(info, height, getRealPlayer);
    else playerEl = await getRealPlayer();
  } else playerEl = await setPlyr();

  if (playerEl) {
    const width = ogWarpper.getAttr("width");
    if (width) {
      playerEl.style.width = width + "px";
      playerEl.style.minWidth = "0px";
    }
    const height = ogWarpper.getAttr("height");
    if (height) {
      playerEl.style.height = height + "px";
      playerEl.style.minHeight = "0px";
    }
  }
  return [playerEl, renderChildren];
};
export default getPlayer;

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

const setupIFrame = (info: HostMediaInfo) => {
  if (info.iframe)
    return createEl("iframe", {
      cls: "bili-iframe",
      attr: {
        src: info.iframe.toString(),
        scrolling: "no",
        border: "0",
        frameborder: "no",
        framespacing: "0",
        allowfullscreen: false,
        sandbox:
          "allow-forms allow-presentation allow-same-origin allow-scripts allow-modals",
      },
    });
  else throw new TypeError("iframe url missing in info");
};
