import { assertNever } from "assert-never";
import { Plyr_TF, getSetupTool, setPlyr } from "modules/player-setup";
import { fetchBiliThumbnail, fetchVimeoThumbnail } from "./thumbnail";
import { getVideoInfo, Host, videoInfo } from "./video-info";

const playButtonHtml = `<svg aria-hidden="true" focusable="false"> <svg id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg></svg ><span class="plyr__sr-only">Play</span>`;

export function getPlayer(url: URL, thumbnail = false): HTMLDivElement | null {
  let info = getVideoInfo(url);
  if (!info) return null;
  const container = createDiv({ cls: "external-video" });
  switch (info.host) {
    case Host.YouTube:
    case Host.Vimeo:
      if (thumbnail) setupThumbnail(container, info);
      else setupPlyr(container, info);
      break;
    case Host.Bilibili:
      if (thumbnail) setupThumbnail(container, info);
      else setupIFrame(container, info);
      break;
    default:
      assertNever(info.host);
  }
  return container;
}

function setupPlyr(container: HTMLDivElement, info: videoInfo): Plyr_TF {
  const tool = getSetupTool(info.src);
  const { timeSpan } = tool;

  let options: Parameters<typeof setPlyr>[3];
  if (info.host === Host.YouTube && timeSpan && timeSpan.start !== 0)
    options = {
      youtube: {
        start: timeSpan.start,
      },
    };
  else options = undefined;

  return setPlyr(container, getIFrame(info), getSetupTool(info.src), options);
}

async function setupThumbnail(
  container: HTMLDivElement,
  info: videoInfo,
): Promise<void> {
  const { id: videoId } = info;

  let thumbnailUrl: string | null;
  let fakePlayHandler: typeof PlyrHandler;
  function PlyrHandler() {
    const player = setupPlyr(container, info);
    player.once("ready", function (evt) {
      this.play();
    });
    container.removeChild(thumbnail);
  }

  switch (info.host) {
    case Host.YouTube:
      thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      fakePlayHandler = PlyrHandler;
      break;
    case Host.Bilibili:
      if (info.id.startsWith("av"))
        thumbnailUrl = await fetchBiliThumbnail(+info.id.substring(2));
      else thumbnailUrl = await fetchBiliThumbnail(info.id);
      fakePlayHandler = () => {
        setupIFrame(container, info);
        container.removeChild(thumbnail);
      };
      break;
    case Host.Vimeo:
      thumbnailUrl = await fetchVimeoThumbnail(info.src);
      fakePlayHandler = PlyrHandler;
      break;
    default:
      assertNever(info.host);
  }

  const thumbnail = createDiv(
    {
      cls: ["thumbnail", "plyr plyr--full-ui plyr--video"],
    },
    (el) => {
      if (thumbnailUrl) el.style.backgroundImage = `url("${thumbnailUrl}")`;
      el.appendChild(
        createEl(
          "button",
          {
            cls: "plyr__control plyr__control--overlaid",
            attr: {
              type: "button",
              "data-plyr": "play",
              "aria-label": "Play",
            },
          },
          (button) => {
            button.innerHTML = playButtonHtml;
            button.onClickEvent(fakePlayHandler);
          },
        ),
      );
    },
  );

  container.appendChild(thumbnail);
}

function getIFrame(info: videoInfo) {
  return createEl("iframe", {
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
  });
}

function setupIFrame(container: HTMLDivElement, info: videoInfo): void {
  container.appendChild(getIFrame(info));
  container.addClass("bili-embed");
}
