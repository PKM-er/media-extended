import { getPlayer } from "external-embed";
import { ItemView, WorkspaceLeaf } from "obsidian";
import Plyr from "plyr";
import { Plyr_TF } from "./player-setup";
import { TimeSpan } from "./temporal-frag";
import { Host, isDirect, videoInfo } from "./video-host/video-info";

export const EX_VIEW_TYPE = "external-media";

export class ExternalMediaView extends ItemView {
  player: Plyr_TF;
  info: videoInfo;
  displayText: string;

  public get src(): Plyr.Source[] {
    return this.player.source.sources;
  }

  public get timeSpan(): TimeSpan | null {
    return this.player.timeSpan;
  }

  public set timeSpan(timeSpan: TimeSpan | null) {
    this.player.setTimeSpan(timeSpan);
  }

  constructor(
    leaf: WorkspaceLeaf,
    info: videoInfo = {
      type: "video",
      link: new URL("http://example.com/video.mp4"),
      filename: "video.mp4",
      src: new URL("http://example.com/video.mp4"),
    },
  ) {
    super(leaf);
    this.info = info;
    const { container, player } = getPlayer(false, info);
    this.player = player as Plyr_TF;
    this.contentEl.appendChild(container);
    this.displayText = isDirect(info)
      ? info.filename
      : Host[info.host] + ": " + info.id;
  }

  isEqual(info: videoInfo) {
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
    // placeholder
    return this.displayText;
  }
}
