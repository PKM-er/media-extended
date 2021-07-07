import {
  EditorPosition,
  ItemView,
  MarkdownView,
  WorkspaceLeaf,
} from "obsidian";
import { mainpart } from "./misc";
import {
  checkMediaType,
  getContainer,
  getPlyr,
  getPlyrForHost,
  getSetupTool,
  infoToSource,
  Plyr_TF,
} from "modules/player-setup";
import { TimeSpan } from "modules/temporal-frag";
import {
  Host,
  isDirect,
  isHost,
  isInternal,
  videoInfo,
} from "modules/video-info";
import TimeFormat from "hh-mm-ss";
import MediaExtended from "main";

export const MEDIA_VIEW_TYPE = "external-media";
export class MediaView extends ItemView {
  player: Plyr_TF;
  plugin: MediaExtended;
  info: videoInfo | null;
  trackObjUrls: string[];
  displayText: string = "No Media";
  private leafOpen_bak: WorkspaceLeaf["open"];
  private controls: Map<string, HTMLElement>;

  public set src(info: videoInfo) {
    if (!this.isEqual(info)) {
      this.revokeObjUrls();
      this.showControls();

      const source = infoToSource(info);
      this.player.sourceBak = source;
      this.player.source = source;
      checkMediaType(info, this.player);

      this.hash = info.hash;

      const isPipEnabledBefore = this.player.pip;
      this.player.pip = false;
      if (isHost(info)) {
        this.hideControl("pip");
      } else {
        this.showControl("pip");
        if (isPipEnabledBefore)
          this.player.once("playing", () => {
            this.player.pip = true;
          });
      }
      this.info = info;

      this.setDisplayText(info);
      this.load();
    } else console.error("to update timestamp, use MediaView.hash");
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

  constructor(leaf: WorkspaceLeaf, plugin: MediaExtended, info?: videoInfo) {
    super(leaf);
    this.plugin = plugin;
    this.info = info ?? null;
    info = info ?? {
      type: "video",
      link: new URL("http://example.com/video.mp4"),
      filename: "No Media",
      src: new URL("http://example.com/video.mp4"),
      hash: "",
    };
    if (isInternal(info) && info.trackInfo) {
      this.trackObjUrls = info.trackInfo.objUrls;
    } else {
      this.trackObjUrls = [];
    }

    let player: Plyr_TF;
    if (isHost(info)) {
      player = getPlyrForHost(info, this.plugin.settings.useYoutubeControls);
    } else {
      player = getPlyr(info);
    }
    this.player = player;
    this.contentEl.appendChild(getContainer(player));
    this.setDisplayText(info);
    this.leafOpen_bak = leaf.open;
    // @ts-ignore
    leaf.open = (view) => {
      if (view instanceof MediaView) return this.leafOpen_bak.bind(leaf)(view);
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

  getTimeStamp(sourcePath?: string) {
    if (!this.info) return null;
    const current = this.player.currentTime;
    const display = TimeFormat.fromS(current, "hh:mm:ss").replace(/^00:/g, "");
    if (isInternal(this.info)) {
      const linktext = this.app.metadataCache.fileToLinktext(
        this.info.src,
        sourcePath ?? "",
        true,
      );
      return `[[${linktext}#t=${display}]]`;
    } else
      return (
        `[${display.replace(/\.\d+$/, "")}]` +
        `(${mainpart(this.info.src)}#t=${current})`
      );
  }

  async onOpen() {
    if (this.info === null) this.hideControls();
    else if (isHost(this.info)) this.hideControl("pip");
  }

  revokeObjUrls() {
    this.trackObjUrls.forEach((url) => URL.revokeObjectURL(url));
    this.trackObjUrls.length = 0;
  }

  unload() {
    this.revokeObjUrls();
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

  isEqual(info: videoInfo): Boolean {
    if (this.info === null) return false;
    if (isInternal(info) && isInternal(this.info)) {
      return info.src.path === this.info.src.path;
    } else if (isDirect(info) && isDirect(this.info)) {
      return mainpart(info.link) === mainpart(this.info.link);
    } else if (isHost(info) && isHost(this.info)) {
      return info.host === this.info.host && info.id === this.info.id;
    } else return false;
  }

  getViewType(): string {
    return MEDIA_VIEW_TYPE;
  }
  getDisplayText() {
    return this.displayText;
  }

  setDisplayText(info: videoInfo | null) {
    if (!info) {
      this.displayText = "No Media";
    } else {
      this.displayText =
        isDirect(info) || isInternal(info)
          ? info.filename
          : Host[info.host] + ": " + info.id;
    }
  }
}
