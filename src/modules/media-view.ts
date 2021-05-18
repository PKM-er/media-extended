import { getPlayer } from "external-embed";
import { ItemView, WorkspaceLeaf } from "obsidian";
import Plyr from "plyr";
import { getSetupTool, Plyr_TF, setPlyr, setRatio } from "./player-setup";
import { TimeSpan } from "./temporal-frag";
import { Host, isDirect, videoInfo } from "./video-host/video-info";

export const EX_VIEW_TYPE = "external-media";

export class ExternalMediaView extends ItemView {
  player: Plyr_TF;
  container: HTMLDivElement;
  info: videoInfo | null;
  displayText: string = "No Media";

  public set src(info: videoInfo) {
    if (!this.isEqual(info)) {
      let source: Plyr.SourceInfo;
      if (isDirect(info)) {
        source = {
          type: info.type,
          sources: [{ src: info.link.href }],
        };
      } else {
        if (info.host === Host.bili) {
          console.error("Bilibili not supported in Plyr");
          return;
        }
        source = {
          type: "video",
          sources: [
            { src: info.id, provider: Host[info.host] as "vimeo" | "youtube" },
          ],
        };
      }
      this.info = info;
      this.player.source = source;
      this.setDisplayText(info);
      this.load();
    }
    this.hash = info.src.hash;
    setRatio(this.container, this.player);
    if (this.contentEl.hidden) this.contentEl.hidden = false;
  }

  public get timeSpan(): TimeSpan | null {
    return this.player.timeSpan;
  }

  public set timeSpan(timeSpan: TimeSpan | null) {
    this.player.setTimeSpan(timeSpan);
  }

  public set hash(hash: string) {
    const { timeSpan, is } = getSetupTool(hash);
    this.player.setTimeSpan(timeSpan);
    this.player.autoplay = is("autoplay");
    this.player.loop = is("loop");
    this.player.muted = is("muted");
  }

  constructor(leaf: WorkspaceLeaf, info?: videoInfo) {
    super(leaf);
    this.info = info ?? null;
    info = info ?? {
      type: "video",
      link: new URL("http://example.com/video.mp4"),
      filename: "No Media",
      src: new URL("http://example.com/video.mp4"),
    };
    const { container, player } = getPlayer(false, info);
    this.player = player as Plyr_TF;
    this.container = container;
    this.contentEl.appendChild(container);
    this.setDisplayText(info);
  }

  async onOpen() {
    if (this.displayText === "No Media") {
      this.contentEl.hidden = true;
    }
  }

  isEqual(info: videoInfo) {
    if (this.info === null) return false;
    if (isDirect(info) && isDirect(this.info)) {
      const mainpart = (url: URL) => url.href.slice(0, -url.hash.length);
      return mainpart(info.link) === mainpart(this.info.link);
    } else if (!isDirect(info) && !isDirect(this.info)) {
      return info.host === this.info.host && info.id === this.info.id;
    }
  }

  getViewType(): string {
    return EX_VIEW_TYPE;
  }
  getDisplayText() {
    return this.displayText;
  }

  setDisplayText(info: videoInfo | null) {
    if (!info) {
      this.displayText = "No Media";
    } else {
      this.displayText = isDirect(info)
        ? info.filename
        : Host[info.host] + ": " + info.id;
    }
  }

  private updateTitle() {
    const titleEl = this.containerEl.querySelector("div.view-header-title");
    if (titleEl) (titleEl as HTMLDivElement).innerText = this.getDisplayText();
    else console.error("title missing: %o", this.contentEl);
  }
}
