import { registerScope } from "@feature/keyboard";
import { createStore } from "@player";
import {
  renameObsidianMedia,
  setMediaUrlSrc,
  setObsidianMediaSrc,
} from "@player";
import type MediaExtended from "@plugin";
import { ExtensionAccepted } from "mx-base";
import { Provider } from "mx-base";
import { Player, seekTo } from "mx-player";
import { setFragment, setHash } from "mx-store";
import { toggleFilter } from "mx-store";
import { revertDuration } from "mx-store";
import {
  selectCurrentTime,
  selectDuration,
  selectFrag,
  subscribe,
} from "mx-store";
import { isHTMLMediaSource, PlayerType } from "mx-store";
import {
  Command,
  EditableFileView,
  ItemView,
  Menu,
  Notice,
  Platform,
  Scope,
  TFile,
  ViewStateResult,
  WorkspaceLeaf,
} from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import {
  actions,
  getBiliInjectCodeFunc,
  MEDIA_VIEW_TYPE,
  MediaState,
  MediaStateBase,
  PlayerComponent,
} from "./common";
import { createWindow } from "./window";

declare module "obsidian" {
  interface FileView {
    loadFile(file: TFile | null): Promise<void>;
    titleEl: HTMLElement;
    saveTitle(): Promise<void>;
    onTitleChange(): void;
  }
  interface App {
    openWithDefaultApp(path: string): Promise<void>;
  }
}

export default class ObMediaView
  extends EditableFileView
  implements PlayerComponent
{
  allowNoFile = true;
  // no need to manage this manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  scope;
  store;
  // set port(port: MessagePort | null) {
  //   this.store.msgHandler.port = port;
  // }
  // get port() {
  //   return this.store.msgHandler.port;
  // }

  public setHash(...args: [hash: string, fromLink: boolean]) {
    this.store.dispatch(setHash(args));
  }
  setFile(file: TFile) {
    this.store.dispatch(setObsidianMediaSrc(file));
  }
  setUrl(url: string) {
    this.store.dispatch(setMediaUrlSrc(url));
  }
  getUrl(src = false): string | null {
    const { meta } = this.store.getState();
    if (meta.provider !== Provider.obsidian && meta.provider) {
      return meta.url;
    } else return null;
  }

  canAcceptExtension(ext: string): boolean {
    for (const exts of ExtensionAccepted.values()) {
      if (exts.includes(ext)) return true;
    }
    return false;
  }

  openExternalAction: HTMLElement;

  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createStore("media-view " + (leaf as any).id);
    this.scope = new Scope(this.app.scope);
    registerScope(this);

    this.openExternalAction = this.addAction(
      "open-elsewhere-glyph",
      "Open In External Player/Browser",
      () => {
        let url;
        if (this.file && Platform.isDesktopApp) {
          app.openWithDefaultApp(this.file.path);
        } else if ((url = this.getUrl(true))) {
          window.open(url, "_blank");
        } else {
          new Notice("Failed to open media");
        }
      },
    );
    this.pinnedAction.style.display = "none";

    this.register(
      subscribe(
        this.store,
        (state) => state.meta.title,
        () => this.titleEl.setText(this.getDisplayText()),
      ),
    );
    this.register(
      subscribe(
        this.store,
        (state) => state.meta.provider,
        (from) => {
          if (from === Provider.obsidian && Platform.isDesktopApp) {
            this.openExternalAction.style.removeProperty("display");
            this.openExternalAction.setAttr(
              "aria-label",
              "Open In External Player",
            );
          } else if (from && from !== Provider.obsidian) {
            this.openExternalAction.style.removeProperty("display");
            this.openExternalAction.setAttr("aria-label", "Open In Browser");
          } else {
            this.openExternalAction.style.display = "none";
          }
        },
        true,
      ),
    );
  }

  setEphemeralState(state: any): void {
    const { subpath, fromLink = false } = state;
    this.setHash(subpath, fromLink);
    super.setEphemeralState(state);
  }

  getViewType(): string {
    return MEDIA_VIEW_TYPE;
  }
  getDisplayText(): string {
    if (this.file) return this.file.basename;
    const { provider, title } = this.store.getState().meta;
    if (provider === Provider.obsidian) return "No Media";

    let titleText: string;
    if (title === null) {
      titleText = ""; // loading title
    } else if (title === undefined) {
      titleText = "No Media";
    } else {
      titleText = title;
    }
    return titleText;
  }

  getState(): MediaState {
    let viewState = super.getState() as MediaState;
    const state = this.store.getState();
    const common: Required<MediaStateBase> = {
      fragment: selectFrag(state),
      currentTime: selectCurrentTime(state),
      duration: selectDuration(state),
      pinned: this.pinned,
    };

    let url;
    if (this.file) {
      return { ...viewState, ...common };
    } else if ((url = this.getUrl())) {
      return { ...viewState, file: null, url, ...common };
    } else {
      console.error("unexpected state", viewState, state.source);
      return viewState;
      // throw new Error("Failed to get state for media view: unexpected state");
    }
  }

  /**
   * internal pinned state,
   * prevent other types of view from opening in current leaf
   * but allow history to be restored
   */
  private _pinned: boolean = false;
  get pinned() {
    return this._pinned;
  }
  set pinned(pinned: boolean) {
    if (this.pinned !== pinned) {
      this._pinned = pinned;
      if (pinned) this.pinnedAction.style.removeProperty("display");
      else this.pinnedAction.style.display = "none";
    }
  }
  pinnedAction = this.addAction(
    "pin",
    "Unpin Media View",
    () => (this.pinned = false),
  );

  async setState(state: MediaState, result: ViewStateResult): Promise<void> {
    if (state.file === state.url || (state.file && state.url)) {
      console.error("unexpected state", state, result);
      throw new Error("Failed to set state for media view: unexpected state");
    }
    // wait until onLoadFile is done;
    // setstate => loadFile => onLoadFile
    await super.setState(state, result);
    if (state.url) {
      this.setUrl(state.url);
    }
    let { fragment, currentTime, duration, pinned } = state;
    if (
      fragment !== undefined &&
      (fragment === null || Array.isArray(fragment))
    ) {
      this.store.dispatch(setFragment(fragment));
    }
    if (typeof currentTime === "number" && currentTime >= 0) {
      this.store.dispatch(seekTo(currentTime));
    }
    if (typeof duration === "number" && duration > 0) {
      this.store.dispatch(revertDuration(duration));
    }

    if (pinned !== undefined) this.pinned = pinned;
  }
  async onLoadFile(file: TFile): Promise<void> {
    this.setFile(file);
    return super.onLoadFile(file);
  }

  window?: Electron.BrowserWindow;
  protected async onOpen(): Promise<void> {
    await super.onOpen();
    ReactDOM.render(
      <Player
        store={this.store}
        actions={actions}
        getBiliInjectCode={getBiliInjectCodeFunc(this.plugin)}
      />,
      this.contentEl,
    );
  }
  private _closed = false;
  async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    this._closed = true;
    this.window?.destroy();
    return super.onClose();
  }

  //#region patch to better handle the case when no file

  // disable rename when no file
  loadFile(file: TFile | null): Promise<void> {
    if (file === null) {
      this.titleEl.contentEditable = "false";
    } else {
      this.titleEl.contentEditable = "true";
    }
    return super.loadFile(file);
  }
  saveTitle(): Promise<void> {
    if (this.file === null) return Promise.resolve();
    return super.saveTitle();
  }
  onTitleChange(): void {
    if (this.file === null) return;
    return super.onTitleChange();
  }

  async onRename(file: TFile) {
    if (file === this.file) {
      const mediaEl =
        this.containerEl.querySelector<HTMLMediaElement>("video, audio");
      if (mediaEl) {
        const { currentTime, paused } = mediaEl;
        mediaEl.addEventListener(
          "loadedmetadata",
          function () {
            this.currentTime = currentTime;
            if (this.paused !== paused) {
              this[paused ? "pause" : "play"]();
            }
          },
          { once: true, passive: true },
        );
      }
      this.store.dispatch(renameObsidianMedia(file));
    }
    return super.onRename(file);
  }
  async onDelete(file: TFile): Promise<void> {
    // override default allowNoFile behavior to close the view when delete
    if (file === this.file) {
      this.allowNoFile = false;
    }
    return super.onDelete(file);
  }

  onMoreOptionsMenu(menu: Menu): void {
    let url;
    let _pluginDir: string | undefined;
    if ((_pluginDir = this.plugin.getFullPluginDir())) {
      let pluginDir = _pluginDir;
      menu.addItem((item) =>
        item
          .setIcon("open-elsewhere-glyph")
          .setTitle("Open In Window")
          .onClick(() => {
            this.window = createWindow(this.store, this.plugin);
            this.window.on("close", () => {
              if (!this._closed)
                ReactDOM.render(
                  <Player
                    store={this.store}
                    actions={actions}
                    getBiliInjectCode={getBiliInjectCodeFunc(this.plugin)}
                  />,
                  this.contentEl,
                );
            });
            ReactDOM.unmountComponentAtNode(this.contentEl);
          }),
      );
    }
    if (!this.pinned) {
      menu.addItem((item) =>
        item
          .setIcon("pin")
          .setTitle("Pin Media View")
          .onClick(() => (this.pinned = true)),
      );
    }
    const media =
      this.contentEl.querySelector("video") ??
      this.contentEl.querySelector("audio");
    if (media) {
      menu.addItem((item) =>
        item
          .setIcon("reset")
          .setTitle("Reload Media")
          .onClick(async () => {
            const time = media.currentTime;
            media.load();
            media.currentTime = time;
            let { paused } = this.store.getState().controlled;
            if (!paused) await media.play();
          }),
      );
    }
    const { source } = this.store.getState();
    if (isHTMLMediaSource(source) && source.type !== PlayerType.audio) {
      menu.addItem((item) =>
        item
          .setIcon("aperture")
          .setTitle("Toggle Filter")
          .onClick(() => this.store.dispatch(toggleFilter())),
      );
    }

    if (this.file) {
      super.onMoreOptionsMenu(menu);
    } else if ((url = this.getUrl())) {
      ItemView.prototype.onMoreOptionsMenu.call(this, menu);
      menu.addSeparator();
      this.app.workspace.trigger(
        "media-url-menu",
        menu,
        url,
        "pane-more-options",
        this.leaf,
      );
    } else {
      throw new Error("no file or url set for media view");
    }
  }
  //#endregion
}

export const ToggleMediaPin: Command = {
  id: "toggle-media-pin",
  name: "Toggle Media Pin",
  checkCallback: (checking) => {
    const active = app.workspace.activeLeaf;
    if (!(active?.view instanceof ObMediaView)) return false;
    if (!checking) active.view.pinned = !active.view.pinned;
    return true;
  },
};
