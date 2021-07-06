import { videoInfo_Host } from "modules/video-info";

export const setupIFrame = (
  container: HTMLDivElement,
  info: videoInfo_Host,
): void => {
  container.appendChild(
    createEl("iframe", {
      cls: "external-video",
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
  );
  container.addClass("bili-embed");
};
