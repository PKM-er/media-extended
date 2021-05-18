import { getPlayer } from "external-embed";
import { ItemView, MarkdownView, Menu, WorkspaceLeaf } from "obsidian";
import Plyr from "plyr";
import { mainpart } from "./misc";
import { getSetupTool, Plyr_TF, setPlyr, setRatio } from "./player-setup";
import { TimeSpan } from "./temporal-frag";
import { Host, isDirect, videoInfo } from "./video-host/video-info";
import TimeFormat from "hh-mm-ss";

export const EX_VIEW_TYPE = "external-media";

export class ExternalMediaView extends ItemView {
  player: Plyr_TF;
  container: HTMLDivElement;
  info: videoInfo | null;
  displayText: string = "No Media";
  baseMenu: (menu: Menu) => void;

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
    this.baseMenu = this.onMoreOptionsMenu;
    this.onMoreOptionsMenu = (menu: Menu) => {
      this.extendedMenu(menu);
      this.baseMenu.bind(this)(menu);
    };
  }

  extendedMenu(menu: Menu) {
    menu.addItem((item) =>
      item
        .setIcon("star")
        .setTitle("Get current Timestamp")
        .onClick(() => {
          const timestamp = this.getTimeStamp();
          if (!timestamp) return;
          // @ts-ignore
          const group = this.app.workspace.getGroupLeaves(this.leaf.group);
          for (const leaf of group) {
            if (leaf.view instanceof MarkdownView) {
              const editor = leaf.view.editor;
              const lastPos = { ch: 0, line: editor.lastLine() + 1 };
              editor.replaceRange("\n" + timestamp, lastPos, lastPos);
              return;
            }
          }
        }),
    );
  }

  getTimeStamp() {
    if (!this.info) return null;
    const current = this.player.currentTime;
    const display = TimeFormat.fromS(current, "hh:mm:ss").replace(
      /^00:|\.\d+$/g,
      "",
    );
    return `[${display}](${mainpart(this.info.src)}#t=${current})`;
  }

  async onOpen() {
    if (this.displayText === "No Media") {
      this.contentEl.hidden = true;
    }
  }

  isEqual(info: videoInfo) {
    if (this.info === null) return false;
    if (isDirect(info) && isDirect(this.info)) {
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
}
