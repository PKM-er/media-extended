import assertNever from "assert-never";
import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { getUrl } from "modules/misc";
import { setPlyr, getSetupTool } from "modules/player-setup";
import {
  setupThumbnail,
  setupPlyr,
  setupIFrame,
} from "modules/video-host/get-player";
import {
  getVideoInfo,
  Host,
  isDirect,
  videoInfo,
} from "modules/video-host/video-info";

export function processExternalEmbeds(this: MediaExtended, docEl: HTMLElement) {
  const handler = new ExternalEmbedHandler();
  for (const el of docEl.querySelectorAll("img[referrerpolicy]")) {
    // <img src="" referrerpolicy="no-referrer">
    const img = el as HTMLImageElement;
    handler.setTarget(img).handle(this.settings.thumbnailPlaceholder);
  }
}

class ExternalEmbedHandler extends Handler<HTMLImageElement> {
  constructor(target?: HTMLImageElement) {
    if (target) super(target);
    else super(createEl("img"));
  }

  private get info(): videoInfo | null {
    const url = getUrl(this.linktext);
    if (!url) return null;
    return getVideoInfo(url);
  }

  public get linktext(): string {
    return this.target.src;
  }

  handle(thumbnail = false): boolean {
    if (!this.info) return false;
    const newEl = getPlayer(thumbnail, this.info);
    if (newEl) this.replaceWith(newEl);
    return Boolean(newEl);
  }
}

export function getPlayer(
  thumbnail: boolean,
  info: videoInfo,
): HTMLDivElement | null {
  const container = createDiv({ cls: "external-video" });
  if (isDirect(info)) {
    const playerEl = createEl(info.type);
    playerEl.src = info.link.href;
    playerEl.controls = true;
    const container = createDiv({ cls: "local-media" });
    setPlyr(container, playerEl, getSetupTool(info.link.hash));
    return container;
  }

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
