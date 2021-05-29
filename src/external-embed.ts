import assertNever from "assert-never";
import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { getUrl } from "modules/misc";
import { setPlyr, getSetupTool, Plyr_TF } from "modules/player-setup";
import {
  setupThumbnail,
  setupPlyr,
  setupIFrame,
} from "modules/video-host/get-player";
import {
  getVideoInfo,
  Host,
  isDirect,
  isHost,
  isInternal,
  videoInfo,
  videoInfo_Host,
} from "modules/video-host/video-info";

export function processExternalEmbeds(this: MediaExtended, docEl: HTMLElement) {
  for (const el of docEl.querySelectorAll("img[referrerpolicy]")) {
    // <img src="" referrerpolicy="no-referrer">
    const img = el as HTMLImageElement;
    new ExternalEmbedHandler(img, this).handle();
  }
}

class ExternalEmbedHandler extends Handler<HTMLImageElement> {
  plugin: MediaExtended;

  constructor(target: HTMLImageElement, plugin: MediaExtended) {
    super(target);
    this.plugin = plugin;
  }

  private async getInfo(): Promise<videoInfo | null> {
    const url = getUrl(this.linktext);
    if (!url) return null;
    else return await getVideoInfo(url);
  }

  public get linktext(): string {
    return this.target.src;
  }

  async handle(): Promise<boolean> {
    const info = await this.getInfo();
    if (!info) return false;
    const newEl = getPlayer(
      this.plugin.settings.thumbnailPlaceholder,
      info,
      this.plugin.settings.useYoutubeControls,
    );
    if (newEl) this.replaceWith(newEl.container);
    return Boolean(newEl);
  }
}

export function getPlayer(
  thumbnail: boolean,
  info: videoInfo,
  useYtControls: boolean,
): { player: Plyr_TF | null; container: HTMLDivElement } {
  if (isDirect(info) || isInternal(info)) {
    const playerEl = createEl(info.type);
    playerEl.src = info.link.href;
    playerEl.controls = true;
    const container = createDiv({ cls: "local-media" });
    let trackInfo = isInternal(info) ? info.trackInfo : undefined;
    let player = setPlyr(
      container,
      playerEl,
      getSetupTool(info.link.hash),
      undefined,
      trackInfo?.trackEls,
    );
    return { player, container };
  }
  if (isHost(info)) {
    const container = createDiv({ cls: "external-video" });
    let player: Plyr_TF | null = null;
    switch (info.host) {
      case Host.youtube:
      case Host.vimeo:
        if (thumbnail) setupThumbnail(container, info, useYtControls);
        else player = setupPlyr(container, info, useYtControls);
        break;
      case Host.bili:
        if (thumbnail) setupThumbnail(container, info);
        else setupIFrame(container, info);
        break;
      default:
        assertNever(info.host);
    }
    return { player, container };
  }
  assertNever(info);
}
