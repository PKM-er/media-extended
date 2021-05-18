import assertNever from "assert-never";
import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { getUrl, getMediaType } from "modules/misc";
import { setPlyr, getSetupTool } from "modules/player-setup";
import {
  setupThumbnail,
  setupPlyr,
  setupIFrame,
} from "modules/video-host/get-player";
import { getVideoInfo, Host } from "modules/video-host/video-info";

export function processExternalEmbeds(this: MediaExtended, docEl: HTMLElement) {
  const handler = new ExternalEmbedHandler();
  for (const el of docEl.querySelectorAll("img[referrerpolicy]")) {
    // <img src="" referrerpolicy="no-referrer">
    const img = el as HTMLImageElement;
    handler
      .setTarget(img)
      .doDirectLink()
      ?.doVideoHost(this.settings.thumbnailPlaceholder);
  }
}

class ExternalEmbedHandler extends Handler<HTMLImageElement> {
  constructor(target?: HTMLImageElement) {
    if (target) super(target);
    else super(createEl("img"));
  }

  public get linktext(): string {
    return this.target.src;
  }

  doDirectLink(): this | null {
    const url = getUrl(this.linktext);
    if (!url) return this;

    const fileType = getMediaType(url);

    if (fileType) {
      const playerEl = createEl(fileType);
      playerEl.src = this.link;
      playerEl.controls = true;
      const container = createDiv({ cls: "local-media" });
      setPlyr(container, playerEl, getSetupTool(this.hash));
      this.replaceWith(container);
      return null;
    } else return this;
  }

  doVideoHost(thumbnail = false): this | null {
    const newEl = this.getPlayer(thumbnail);
    if (newEl) {
      this.replaceWith(newEl);
      return null;
    } else return this;
  }

  getPlayer(thumbnail: boolean): HTMLDivElement | null {
    const url = getUrl(this.linktext);
    if (!url) return null;

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
}
