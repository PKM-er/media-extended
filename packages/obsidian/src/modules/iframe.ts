import { HostMediaInfo } from "mx-lib";

export const setupIFrame = (info: HostMediaInfo) => {
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
