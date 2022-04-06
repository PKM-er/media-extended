import {
  getLink,
  getMediaInfo,
  InternalMediaInfo,
  isObsidianMediaInfo,
  MediaInfo,
} from "@base/media-info";
import type MediaExtended from "@plugin";
import assertNever from "assert-never";
import TimeFormat from "hh-mm-ss";
import { around } from "monkey-around";
import {
  DirectLinkInfo,
  HashTool,
  HostMediaInfo,
  MediaInfoType,
  Plyr_TF,
  TimeSpan,
} from "mx-lib";
import {
  App,
  FileView,
  MarkdownView,
  Menu,
  Modal,
  Notice,
  SplitDirection,
  TFile,
  ViewStateResult,
  WorkspaceLeaf,
} from "obsidian";

import { insertToCursor, mainpart } from "../misc";
import { getContainer, getPlyr } from "./plyr-setup";

export const MEDIA_VIEW_TYPE = "media-view";

export class MediaView extends FileView {
  plugin: MediaExtended;
  allowNoFile = true;

  core: {
    info: MediaInfo;
    player: Plyr_TF;
  } | null = null;

  get player(): Plyr_TF | null {
    return this.core?.player ?? null;
  }

  emptyEl: HTMLDivElement;
  playerEl: HTMLDivElement;
  private controls: Map<string, HTMLElement>;

  async onLoadFile(file: TFile): Promise<void> {
    const info = await getMediaInfo(
      { type: "internal", file, hash: "" },
      this.app,
    );
    if (info) {
      this.setInfo(info);
    } else new Notice("Fail to open file");
  }

  async onRename(file: TFile) {
    if (this.file && this.file === file && this.core) {
      const { info } = this.core;
      const { currentTime } = this.core.player;
      await this.setInfo(
        await getMediaInfo(
          { type: "internal", file, hash: info.hash },
          this.app,
        ),
      );
      if (this.player) {
        // await this.player.play();
        this.player.once("canplay", function () {
          window.setTimeout(() => (this.currentTime = currentTime), 200);
          // this.pause();
        });
      }
    }
    super.onRename(file);
  }

  async onDelete(file: TFile) {
    super.onDelete(file);
    if (this.file && this.file === file) this.leaf.detach();
  }

  get info(): MediaInfo | null {
    return this.core?.info ?? null;
  }
  async setInfo(info: MediaInfo | null) {
    if (info === null) {
      this.showEmpty();
      if (info) this.unloadCore();
      // @ts-ignore
      this.file = null;
    } else if (!this.isEqual(info)) {
      this.showEmpty(true);
      if (info) this.unloadCore();

      if (info.from === MediaInfoType.Obsidian) {
        this.file = info.getSrcFile();
        await info.updateTrackInfo();
      }

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
    state.info = this.info;
    state.currentTime = this.core ? this.core.player.currentTime : 0;
    return state;
  }
  setProgressTo(time: number, delay?: number) {
    return new Promise<void>((resolve, reject) =>
      window.setTimeout(async () => {
        if (this.core) {
          const { player } = this.core;
          player.once("playing", () => {
            player.currentTime = time;
            player.pause();
          });
          await player.play();
          resolve();
        } else {
          reject("fail to set currentTime: media view empty");
        }
      }, delay),
    );
  }
  async setState(state: any, result: ViewStateResult): Promise<void> {
    let info = state.info as MediaInfo | null | undefined;
    const currentTime = state.currentTime as number;
    try {
      if (!info) {
        if (info === null) await this.setInfo(info);
      } else if (info.from === MediaInfoType.Host) {
        info.src = new URL(info.src as any);
        info.iframe = new URL(info.iframe as any);
        await this.setInfo(info);
        if (currentTime) this.setProgressTo(currentTime);
      } else if (info.from === MediaInfoType.Direct) {
        info.src = new URL(info.src as any);
        await this.setInfo(info);
        if (currentTime) this.setProgressTo(currentTime);
      } else if (isObsidianMediaInfo(info)) {
        if (!(info instanceof InternalMediaInfo)) {
          info = new InternalMediaInfo(info, this.app);
        }
        await this.setInfo(info);
        if (currentTime) this.setProgressTo(currentTime);
      } else assertNever(info);
    } catch (e) {
      console.error(e);
      await this.setInfo(null);
    }

    await super.setState(state, result);
  }

  onMoreOptionsMenu(menu: Menu): void {
    const getSpeedMenu = (app: App) => {
      const map = new Map<string, string>([
        ["0.5×", "0.5"],
        ["0.75×", "0.75"],
        ["Normal", "1"],
        ["1.25×", "1.25"],
        ["1.5×", "1.5"],
        ["1.75×", "1.75"],
        ["2×", "2"],
      ]);
      const menu = new Menu(app);
      for (const [text, value] of map) {
        menu.addItem((item) =>
          item
            .setTitle(text)
            .setActive(Boolean(this.player && this.player.speed === +value))
            .onClick(() => {
              if (this.player) this.player.speed = +value;
            }),
        );
      }
      return menu;
    };
    menu.addItem((item) =>
      item.setTitle("Speed Control").onClick((evt) => {
        const speed = getSpeedMenu(this.app);
        if (evt instanceof MouseEvent) {
          speed.showAtMouseEvent(evt);
        } else {
          speed.showAtPosition(item.dom.getBoundingClientRect());
        }
      }),
    );
    menu.addSeparator();
    super.onMoreOptionsMenu(menu);
  }

  constructor(leaf: WorkspaceLeaf, plugin: MediaExtended, info?: MediaInfo) {
    super(leaf);
    this.plugin = plugin;
    this.emptyEl = this.setEmpty();
    this.playerEl = this.contentEl.createDiv({ cls: "media-view-player" });

    // add close button for mobile
    if (this.app.isMobile)
      this.addAction("cross", "Close", () => this.leaf.detach());
    this.controls = this.getControls();

    // prevent view from switching to other type when MarkdownView in group change mode
    const unload = around(leaf, {
      // @ts-ignore
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      open(next) {
        return function (this: WorkspaceLeaf, view) {
          if (this.group) {
            if (view instanceof MediaView) return next.call(this, view);
          } else return next.call(this, view);
        };
      },
    });
    this.register(unload);
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

  set hash(hash: string) {
    if (!this.player)
      throw new Error("trying to set timeSpan on empty media view");

    const hashTool = new HashTool(hash);

    hashTool.setTimeSpan(this.player);
    this.player.autoplay = hashTool.is("autoplay");
    this.player.loop = hashTool.is("loop");
    this.player.muted = hashTool.is("muted");
  }

  unloadCore() {
    if (this.core) {
      const { info, player } = this.core;
      if (info.from === MediaInfoType.Obsidian && info.trackInfo)
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
    const getName = (filename: string) => {
      const arr = filename.split(".");
      arr.pop();
      return arr.join(".");
    };
    if (this.core) {
      const { info, player } = this.core;
      if (
        info.from === MediaInfoType.Obsidian ||
        info.from === MediaInfoType.Direct
      )
        return getName(info.filename);
      else {
        if (info.host === "youtube" || info.host === "vimeo") {
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
        return info.host + ": " + info.id;
      }
    } else return "";
  }

  isEqual(newMedia: MediaInfo): Boolean {
    if (this.info === null || this.info.from !== newMedia.from) return false;
    if (this.info.from === MediaInfoType.Obsidian) {
      return newMedia.src === this.info.src;
    } else if (this.info.from === MediaInfoType.Direct) {
      const newInfo = newMedia as DirectLinkInfo;
      return mainpart(getLink(newInfo)) === mainpart(getLink(this.info));
    } else if (this.info.from === MediaInfoType.Host) {
      const newInfo = newMedia as HostMediaInfo;
      return (
        newInfo.host === this.info.host &&
        newInfo.id === this.info.id &&
        !(
          newInfo.host === "bilibili" &&
          newInfo.src.searchParams.get("p") !==
            this.info.src.searchParams.get("p")
        )
      );
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
    const { timestampTemplate: template } = this.plugin.settings;
    insertToCursor(template.replace(/{{TIMESTAMP}}/g, timestamp), view);
  };
  getTimeStamp(sourcePath?: string): string | null {
    if (!this.info) return null;
    if (!this.player) throw new Error("no media");
    const current = this.player.currentTime;
    const { timestampOffset: offset } = this.plugin.settings;
    let offsetCurrentTime = current - offset;
    if (current - offset < 0) offsetCurrentTime = 0;
    else if (current - offset > this.player.duration)
      offsetCurrentTime = this.player.duration;
    const display = TimeFormat.fromS(offsetCurrentTime, "hh:mm:ss").replace(
      /^00:/g,
      "",
    );
    if (this.info.from === MediaInfoType.Obsidian) {
      const linktext = this.app.metadataCache.fileToLinktext(
        this.info.getSrcFile(),
        sourcePath ?? "",
        true,
      );
      return `[[${linktext}#t=${display}]]`;
    } else
      return (
        `[${display.replace(/\.\d+$/, "")}]` +
        `(${mainpart(this.info.src)}#t=${offsetCurrentTime})`
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
          const result = await getMediaInfo(
            { type: "external", link: input.value },
            this.app,
          );
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
  info: MediaInfo,
  leaf: WorkspaceLeaf,
  plugin: MediaExtended,
) => {
  const { workspace } = plugin.app;
  if (!(leaf.view instanceof MarkdownView)) {
    new Notice(
      "No MarkdownView active, open new markdown file or click on opened md file",
    );
    return;
  }
  const getDirection = (): SplitDirection => {
    const vw = workspace.rootSplit.containerEl?.clientWidth;
    const vh = workspace.rootSplit.containerEl?.clientHeight;
    if (vh && vw) {
      if (vh < vw) return "vertical";
      else return "horizontal";
    } else {
      console.error(
        "no containerEl for rootSplit, fallback to horizontal",
        workspace.rootSplit,
      );
      return "horizontal";
    }
  };

  const newLeaf = workspace.createLeafBySplit(leaf, getDirection());
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
