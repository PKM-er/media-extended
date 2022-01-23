import { mediaInfo_Host } from "./media-info";

export const setupIFrame = (info: mediaInfo_Host): HTMLDivElement =>
  createEl("iframe", {
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
