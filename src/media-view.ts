import assertNever from "assert-never";
import TimeFormat from "hh-mm-ss";
import { around } from "monkey-around";
import MediaExtended from "mx-main";
import {
  EditorPosition,
  ItemView,
  MarkdownView,
  Modal,
  Notice,
  ViewStateResult,
  WorkspaceLeaf,
} from "obsidian";

import { mainpart } from "./misc";
import {
  getLink,
  getSrcFile,
  getVideoInfo,
  Host,
  isDirect,
  isHost,
  isInternal,
  mediaInfo,
  updateTrackInfo,
} from "./modules/media-info";
import {
  getContainer,
  getPlyr,
  getSetupTool,
  Plyr_TF,
} from "./modules/plyr-setup";
import { getSubtitleTracks } from "./modules/subtitle";
import { TimeSpan } from "./modules/temporal-frag";

export const MEDIA_VIEW_TYPE = "media-view";

export class MediaView extends ItemView {
  plugin: MediaExtended;

  core: {
    info: mediaInfo;
    player: Plyr_TF;
  } | null = null;

  get player(): Plyr_TF | null {
    return this.core?.player ?? null;
  }

  emptyEl: HTMLDivElement;
  playerEl: HTMLDivElement;
  private controls: Map<string, HTMLElement>;

  get info(): mediaInfo | null {
    return this.core?.info ?? null;
  }
  async setInfo(info: mediaInfo | null) {
    if (info === null) {
      this.showEmpty();
      if (info) this.unloadCore();
    } else if (!this.isEqual(info)) {
      this.showEmpty(true);
      if (info) this.unloadCore();

      if (isInternal(info)) await info.updateTrackInfo(this.app.vault);
      const player = getPlyr(info, this.plugin);
      this.playerEl.appendChild(getContainer(player));

      if (player.isHTML5) this.showControl("pip");
      else this.hideControl("pip");

      this.core = { info, player };
      // update display text
      this.load();
      // @ts-ignore
      if (player.isYouTube) {
        const handler = (e: Plyr.PlyrStateChangeEvent) => {
          // @ts-ignore
          // console.log(e.detail.code, player?.config?.title);
          if (e.detail.code === 1) {
            this.load();
            player.off("statechange", handler);
          }
        };
        player.on("statechange", handler);
      }
    } else {
      this.hash = info.hash;
    }
  }
  showEmpty(revert = false) {
    // @ts-ignore
    this.emptyEl.style.display = revert ? "none" : null;
    // @ts-ignore
    this.playerEl.style.display = revert ? null : "none";
    revert ? this.showControls() : this.hideControls();
  }
  getState(): any {
    let state = super.getState();
    state.info = { ...this.info, trackInfo: undefined };
    return state;
  }
  async setState(state: any, result: ViewStateResult): Promise<void> {
    let info = state.info as mediaInfo | null;
    try {
      if (!info) {
        await this.setInfo(info);
      } else if (isHost(info)) {
        info.src = new URL(info.src as any);
        info.iframe = new URL(info.iframe as any);
        await this.setInfo(info);
      } else if (isDirect(info)) {
        info.src = new URL(info.src as any);
        await this.setInfo(info);
      } else if (isInternal(info)) {
        await this.setInfo({
          ...info,
          updateTrackInfo,
          getSrcFile,
        });
      } else assertNever(info);
    } catch (e) {
      console.error(e);
      await this.setInfo(null);
    }

    await super.setState(state, result);
  }

  constructor(leaf: WorkspaceLeaf, plugin: MediaExtended, info?: mediaInfo) {
    super(leaf);
    this.plugin = plugin;
    this.emptyEl = this.setEmpty();
    this.playerEl = this.contentEl.createDiv({ cls: "media-view-player" });
    this.controls = this.getControls();
    // prevent view from switching to other type when MarkdownView in group change mode
    around(leaf, {
      // @ts-ignore
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      open(next) {
        return function (this: any, view) {
          if (view instanceof MediaView) return next.call(this, view);
        };
      },
    });
    this.setInfo(info ?? null);
  }
  private getControls() {
    return new Map([
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
      [
        "open-link",
        this.addAction("go-to-file", "Open Media from link", () =>
          new PromptModal(this.plugin, this).open(),
        ),
      ],
    ]);
  }
  private setEmpty(): HTMLDivElement {
    const { contentEl } = this;
    const mainEl = contentEl.createDiv({ cls: "empty-state" });
    mainEl.createDiv({ cls: "empty-state-container" }, (containerEl) => {
      containerEl.createDiv({ cls: "empty-state-title", text: "No Media" });
      containerEl.createDiv({ cls: "empty-state-action-list" }, (listEl) => {
        const createAction = (
          text: string,
          action: (this: HTMLElement, ev: MouseEvent) => any,
        ) => {
          listEl.createDiv({ cls: "empty-state-action", text }, (el) =>
            el.onClickEvent(action),
          );
        };
        // createAction("Open Local Media in Vault", () => {});
        createAction("Open Media from Link", () => {
          const prompt = new PromptModal(this.plugin, this).open();
        });
      });
    });
    return mainEl;
  }

  get timeSpan(): TimeSpan | null {
    return this.player?.timeSpan ?? null;
  }
  set timeSpan(timeSpan: TimeSpan | null) {
    if (this.player) this.player.setTimeSpan(timeSpan);
    else throw new Error("trying to set timeSpan on empty media view");
  }

  set hash(hash: string) {
    if (!this.player)
      throw new Error("trying to set timeSpan on empty media view");

    const { timeSpan, is } = getSetupTool(hash);
    this.player.setTimeSpan(timeSpan);
    this.player.autoplay = is("autoplay");
    this.player.loop = is("loop");
    this.player.muted = is("muted");
  }

  unloadCore() {
    if (this.core) {
      const { info, player } = this.core;
      if (isInternal(info) && info.trackInfo)
        info.trackInfo.objUrls.forEach((url) => URL.revokeObjectURL(url));
      if (player.pip) player.pip = false;
      player.destroy();
      this.updatePlayerEl();
      this.core = null;
    } else console.warn("core already destoryed");
  }
  private updatePlayerEl() {
    let newEl = createDiv({ cls: "media-view-player" });
    this.playerEl.replaceWith(newEl);
    this.playerEl = newEl;
  }
  unload() {
    this.unloadCore();
  }

  getViewType(): string {
    return MEDIA_VIEW_TYPE;
  }
  getDisplayText() {
    if (this.core) {
      const { info, player } = this.core;
      if (isInternal(info) || isDirect(info)) return info.filename;
      else {
        if (info.host === Host.youtube || info.host === Host.vimeo) {
          // @ts-ignore
          const getTitle = (): string | undefined => player?.config?.title;
          let title;
          if ((title = getTitle())) {
            return title;
          } else {
            // try to fetch title and update displaytext when available
            let count = 0;
            const interval = window.setInterval(() => {
              const title = getTitle();
              if (title) this.load();
              if (title || count > 10) window.clearInterval(interval);
              count++;
            }, 200);
          }
        }
        return Host[info.host] + ": " + info.id;
      }
    } else return "";
  }

  isEqual(newMedia: mediaInfo): Boolean {
    if (this.info === null) return false;
    if (isInternal(newMedia) && isInternal(this.info)) {
      return newMedia.src === this.info.src;
    } else if (isDirect(newMedia) && isDirect(this.info)) {
      return mainpart(getLink(newMedia)) === mainpart(getLink(this.info));
    } else if (isHost(newMedia) && isHost(this.info)) {
      return newMedia.host === this.info.host && newMedia.id === this.info.id;
    } else return false;
  }

  togglePip = () => {
    if (!this.player) throw new Error("no media");
    this.player.pip = !this.player.pip;
  };

  private addToDoc = () => {
    if (this.leaf.group) {
      const group = this.app.workspace.getGroupLeaves(this.leaf.group);
      for (const leaf of group) {
        if (leaf.view instanceof MarkdownView) {
          this.addTimeStampToMDView(leaf.view);
          return;
        }
      }
    } else {
      console.error("no group for leaf: %o", this.leaf);
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
  getTimeStamp(sourcePath?: string): string | null {
    if (!this.info) return null;
    if (!this.player) throw new Error("no media");
    const current = this.player.currentTime;
    const display = TimeFormat.fromS(current, "hh:mm:ss").replace(/^00:/g, "");
    if (isInternal(this.info)) {
      const linktext = this.app.metadataCache.fileToLinktext(
        this.info.getSrcFile(this.app.vault),
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

  showControls() {
    this.controls.forEach((el) => {
      if (el.style.display === "none")
        // @ts-ignore
        el.style.display = null;
    });
  }
  showControl(name: string) {
    const el = this.controls.get(name);
    if (el) {
      if (el.style.display === "none") el.style.display = "";
    } else
      console.error(`control named ${name} not found in %o`, this.controls);
  }
  hideControls() {
    this.controls.forEach((el) => (el.style.display = "none"));
  }
  hideControl(name: string) {
    const el = this.controls.get(name);
    if (el) el.style.display = "none";
    else console.error(`control named ${name} not found in %o`, this.controls);
  }
}

export class PromptModal extends Modal {
  view?: MediaView;
  plugin: MediaExtended;
  constructor(plugin: MediaExtended, view?: MediaView) {
    super(plugin.app);
    this.view = view;
    this.plugin = plugin;
  }

  onOpen() {
    let { contentEl, titleEl, modalEl } = this;

    titleEl.setText("Enter Link to Media");
    const input = contentEl.createEl(
      "input",
      { type: "text" },
      (el) => (el.style.width = "100%"),
    );
    modalEl.createDiv({ cls: "modal-button-container" }, (div) => {
      div.createEl("button", { cls: "mod-cta", text: "Open" }, (el) =>
        el.onClickEvent(async () => {
          const result = await getVideoInfo(input.value);
          if (result) {
            if (this.view) {
              await this.view.setInfo(result);
              this.view.player?.once("ready", function () {
                this.play();
              });
              this.close();
            } else if (this.app.workspace.activeLeaf) {
              openNewView(result, this.app.workspace.activeLeaf, this.plugin);
              this.close();
            } else new Notice("No activeLeaf found");
          } else new Notice("Link not supported");
        }),
      );
      div.createEl("button", { text: "Cancel" }, (el) =>
        el.onClickEvent(() => this.close()),
      );
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

export const openNewView = (
  info: mediaInfo,
  leaf: WorkspaceLeaf,
  plugin: MediaExtended,
) => {
  if (!(leaf.view instanceof MarkdownView)) {
    new Notice(
      "No MarkdownView active, open new markdown file or click on opened md file",
    );
    return;
  }
  const newLeaf = plugin.app.workspace.createLeafBySplit(leaf);
  leaf.setGroupMember(newLeaf);
  const view = new MediaView(newLeaf, plugin, info);
  newLeaf.open(view);

  if (view.core) {
    const { player } = view.core;
    player.once("ready", function () {
      this.play();
    });
  }
};
