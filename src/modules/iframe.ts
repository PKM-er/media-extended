import { videoInfo_Host } from "modules/video-info";

export const setupIFrame = (info: videoInfo_Host): HTMLDivElement =>
  createDiv({ cls: "video-iframe" }, (el) =>
    el.appendChild(
      createEl("iframe", {
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
      }),
    ),
  );
