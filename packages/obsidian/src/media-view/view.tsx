import { ExtensionAccepted } from "@base/media-type";
import { createStore, Player, PlayerStore } from "@player";
import {
  App,
  Component,
  debounce,
  EditableFileView,
  KeymapEventHandler,
  MarkdownRenderChild,
  Scope,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import { setHash } from "../player/slice/controls";
import { setObsidianMediaSrc } from "../player/slice/provider";
import { AppThunk } from "../player/store";
import getPlayerKeymaps from "./keymap";

export const VIEW_TYPE = "media-view-v2";

export interface PlayerComponent extends Component {
  store: PlayerStore;
  scope: Scope;
  keymap: KeymapEventHandler[];
}

const unloadKeymap = (scope: Scope, keymap: KeymapEventHandler[]) => {
  keymap.forEach((k) => scope.unregister(k));
};

export default class MediaView
  extends EditableFileView
  implements PlayerComponent
{
  // no need to manage this manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  scope;
  keymap;
  store;

  setHash = debounce(
    (hash: string) => this.store.dispatch(setHash(hash)),
    200,
    true,
  );
  setFile = debounce(
    (file: TFile) => this.store.dispatch(setObsidianMediaSrc(file)),
    200,
    true,
  );

  canAcceptExtension(ext: string): boolean {
    for (const exts of ExtensionAccepted.values()) {
      if (exts.includes(ext)) return true;
    }
    return false;
  }
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.store = createStore();
    this.scope = new Scope(this.app.scope);
    this.keymap = getPlayerKeymaps(this);
  }

  setEphemeralState(state: any): void {
    const { subpath } = state;
    this.setHash(subpath);
    super.setEphemeralState(state);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.setFile(file);
    super.onLoadFile(file);
    ReactDOM.render(<Player store={this.store} />, this.contentEl);
  }
  async onClose() {
    unloadKeymap(this.scope, this.keymap);
    ReactDOM.unmountComponentAtNode(this.contentEl);
    super.onClose();
  }

  async onRename(file: TFile) {
    // this.events.trigger(
    //   "file-loaded",
    //   (await getMediaInfo(
    //     { type: "internal", file, hash: "" },
    //     this.app,
    //   )) as InternalMediaInfo,
    // );
    return super.onRename(file);
  }

  static displayInEl(
    initAction: AppThunk,
    app: App,
    containerEl: HTMLElement,
    inEditor = false,
  ): PlayerRenderChild {
    return new PlayerRenderChild(initAction, app, containerEl, inEditor);
  }
}

export class PlayerRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  scope;
  keymap;
  store;

  constructor(
    initAction: AppThunk,
    private app: App,
    containerEl: HTMLElement,
    private inEditor: boolean,
  ) {
    super(containerEl);
    this.store = createStore();
    this.store.dispatch(initAction);
    this.scope = new Scope(this.app.scope);
    this.keymap = getPlayerKeymaps(this);
  }

  async onload() {
    ReactDOM.render(<Player store={this.store} />, this.containerEl);
  }
  pushScope() {
    this.app.keymap.pushScope(this.scope);
  }
  popScope() {
    this.app.keymap.popScope(this.scope);
  }
  onunload(): void {
    unloadKeymap(this.scope, this.keymap);
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
