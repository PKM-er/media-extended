import { ExtensionAccepted } from "@base/media-type";
import { getPlayerKeymaps } from "@feature/keyboard-control";
import { Player } from "@player";
import { observeStore, subscribe } from "@player/store";
import type MediaExtended from "@plugin";
import { revertDuration, setFragment } from "@slice/controls";
import { seekTo, setHash } from "@slice/controls/thunk";
import {
  renameObsidianMedia,
  setMediaUrlSrc,
  setObsidianMediaSrc,
} from "@slice/provider/thunk";
import {
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
  createStore,
  MEDIA_VIEW_TYPE,
  MediaState,
  PlayerComponent,
  unloadKeymap,
} from "./common";

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
  keymap;
  store;
  set port(port: MessagePort | null) {
    this.store.msgHandler.port = port;
  }
  get port() {
    return this.store.msgHandler.port;
  }

  public setHash(hash: string, fromLink: boolean) {
    this.store.dispatch(setHash(hash, fromLink));
  }
  setFile(file: TFile) {
    this.store.dispatch(setObsidianMediaSrc(file));
  }
  setUrl(url: string) {
    this.store.dispatch(setMediaUrlSrc(url));
  }
  getUrl(src = false): string | null {
    const { source } = this.store.getState().provider;
    if (!source || source.from === "obsidian") {
      return null;
    } else if (source.from === "direct") {
      return src ? source.src : source.url;
    } else return source.src;
  }

  canAcceptExtension(ext: string): boolean {
    for (const exts of ExtensionAccepted.values()) {
      if (exts.includes(ext)) return true;
    }
    return false;
  }

  openExternalAction: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private plugin: MediaExtended) {
    super(leaf);
    this.store = createStore("media-view " + (leaf as any).id);
    this.scope = new Scope(this.app.scope);
    this.keymap = getPlayerKeymaps(this);

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

    this.register(
      observeStore(
        this.store,
        (state) => state.provider.source,
        (source) => {
          if (source?.from === "obsidian") return;
          const title = source?.title;
          let titleText: string;
          if (title === null) {
            titleText = ""; // loading title
          } else if (title === undefined) {
            titleText = "No Media";
          } else {
            titleText = title;
          }
          this.titleEl.setText(titleText);
        },
      ),
    );
    this.register(
      subscribe(
        this.store,
        (state) => state.provider.source?.from,
        (from) => {
          if (from === "obsidian" && Platform.isDesktopApp) {
            this.openExternalAction.style.removeProperty("display");
            this.openExternalAction.setAttr(
              "aria-label",
              "Open In External Player",
            );
          } else if (from && from !== "obsidian") {
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
    return this.store.getState().provider.source?.title ?? "No Media";
  }

  getState(): MediaState {
    let viewState = super.getState() as MediaState;
    const { controls, provider } = this.store.getState();
    const controlsState = {
      fragment: controls.fragment,
      currentTime: controls.currentTime,
      duration: controls.duration,
    };

    let url;
    if (this.file) {
      return { ...viewState, ...controlsState };
    } else if ((url = this.getUrl())) {
      return { ...viewState, file: null, url, ...controlsState };
    } else {
      console.error("unexpected state", viewState, provider.source);
      return viewState;
      // throw new Error("Failed to get state for media view: unexpected state");
    }
  }

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
    const { fragment, currentTime, duration } = state as MediaState;
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
  }
  async onLoadFile(file: TFile): Promise<void> {
    this.setFile(file);
    return super.onLoadFile(file);
  }

  protected async onOpen(): Promise<void> {
    await super.onOpen();
    ReactDOM.render(
      <Player store={this.store} pluginDir={this.plugin.getFullPluginDir()} />,
      this.contentEl,
    );
  }
  async onClose() {
    unloadKeymap(this.scope, this.keymap);
    ReactDOM.unmountComponentAtNode(this.contentEl);
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
