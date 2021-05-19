import { getPlayer } from "external-embed";
import {
  EditorPosition,
  ItemView,
  MarkdownView,
  WorkspaceLeaf,
} from "obsidian";
import Plyr from "plyr";
import { mainpart } from "./misc";
import { getSetupTool, Plyr_TF, setRatio } from "./player-setup";
import { TimeSpan } from "./temporal-frag";
import { Host, isDirect, videoInfo } from "./video-host/video-info";
import TimeFormat from "hh-mm-ss";

export const EX_VIEW_TYPE = "external-media";
export class ExternalMediaView extends ItemView {
  player: Plyr_TF;
  container: HTMLDivElement;
  info: videoInfo | null;
  displayText: string = "No Media";
  private leafOpen_bak: WorkspaceLeaf["open"];
  private controls: Map<string, HTMLElement>;

  public set src(info: videoInfo) {
    if (!this.isEqual(info)) {
      this.showControls();
      let source: Plyr.SourceInfo;
      if (isDirect(info)) {
        this.showControl("pip");
        source = {
          type: info.type,
          sources: [{ src: info.link.href }],
        };
      } else {
        this.hideControl("pip");
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
  }

  showControls() {
    if (this.contentEl.hidden) this.contentEl.hidden = false;
    this.controls.forEach((el) => {
      if (el.style.display === "none") el.style.display = "";
    });
  }
  showControl(name: string) {
    const el = this.controls.get(name);
    if (el) {
      if (el.style.display === "none") el.style.display = "";
    } else
      console.error(`control named ${name} not found in %o`, this.controls);
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
    this.leafOpen_bak = leaf.open;
    // @ts-ignore
    leaf.open = (view) => {
      if (view instanceof ExternalMediaView)
        return this.leafOpen_bak.bind(leaf)(view);
    };

    this.controls = new Map([
      [
        "get-timestamp",
        this.addAction("star", "Get current Timestamp", this.addToDoc),
      ],
      [
        "pip",
        this.addAction(
          "popup-open",
          "Toggle Picture-in-Picture",
          this.togglePip,
        ),
      ],
    ]);
  }

  togglePip = () => {
    if (this.player.pip) {
    } else {
    }
    this.player.pip = !this.player.pip;
  };

  private addToDoc = () => {
    // @ts-ignore
    const group = this.app.workspace.getGroupLeaves(this.leaf.group);
    for (const leaf of group) {
      if (leaf.view instanceof MarkdownView) {
        this.addTimeStampToMDView(leaf.view);
        return;
      }
    }
  };

  addTimeStampToMDView = (view: MarkdownView) => {
    const timestamp = this.getTimeStamp();
    if (!timestamp) return;
    const { editor } = view;
    const cursor = editor.getCursor();
    let insertPos: EditorPosition;
    insertPos = cursor;
    editor.replaceRange("\n" + timestamp, insertPos, insertPos);
  };

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
    if (this.info === null) this.hideControls();
    else if (!isDirect(this.info)) this.hideControl("pip");
  }

  hideControls() {
    if (!this.contentEl.hidden) this.contentEl.hidden = true;
    this.controls.forEach((el) => (el.style.display = "none"));
  }
  hideControl(name: string) {
    const el = this.controls.get(name);
    if (el) el.style.display = "none";
    else console.error(`control named ${name} not found in %o`, this.controls);
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
