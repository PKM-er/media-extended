import type { MediaProviderElement } from "@aidenlx/player";
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
import React from "preact/compat";
import ReactDOM from "react-dom";

import { getMediaInfo, InternalMediaInfo } from "../base/media-info";
import { ExtensionAccepted } from "../base/media-type";
import { MediaViewEvents } from "./events";
import getPlayerKeymaps from "./keymap";
import { PlayerContext } from "./misc";
import Player, { ShowControls } from "./player";

export const VIEW_TYPE = "media-view-v2";

interface PlayerComponent extends Component {
  scope: Scope;
  keymap: KeymapEventHandler[] | null;
  events: MediaViewEvents;
  player: MediaProviderElement | null;
}

export default class MediaView
  extends EditableFileView
  implements PlayerComponent
{
  player: MediaProviderElement | null = null;
  // no need to manage this manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  scope = new Scope(this.app.scope);
  keymap: KeymapEventHandler[] | null = null;

  events = new MediaViewEvents();

  _hash = "";
  _file: TFile | null = null;
  private async _getInfo(): Promise<InternalMediaInfo | null> {
    return this._file
      ? ((await getMediaInfo(
          { type: "internal", file: this._file, hash: this._hash },
          this.app,
        )) as InternalMediaInfo)
      : null;
  }

  public triggerInfoUpdate = debounce(
    async () => {
      const info = await this._getInfo();
      if (!info) return;
      this.events.trigger("file-loaded", info);
    },
    200,
    true,
  );
  public async setInfo(info: { hash?: string; file?: TFile }, trigger = true) {
    let shouldUpdate = false;
    const { hash, file = this.file } = info;
    if (hash && this._hash !== hash) {
      this._hash = hash;
      shouldUpdate = true;
    }
    if (file.path !== this._file?.path) {
      this._file = file;
      shouldUpdate = true;
    }
    if (trigger && shouldUpdate) {
      this.triggerInfoUpdate();
    }
  }

  canAcceptExtension(ext: string): boolean {
    for (const exts of ExtensionAccepted.values()) {
      if (exts.includes(ext)) return true;
    }
    return false;
  }
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    registerPlayerEvents(this);
  }

  setEphemeralState(state: any): void {
    const { subpath } = state;
    this.setInfo({ hash: subpath });
    super.setEphemeralState(state);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  async onLoadFile(file: TFile): Promise<void> {
    super.onLoadFile(file);
    this.setInfo({ file }, false);
    const info = await this._getInfo();
    if (!info) return;
    ReactDOM.render(
      <PlayerContext.Provider
        value={{
          app: this.app,
          inEditor: false,
          events: this.events,
          containerEl: this.contentEl,
        }}
      >
        <Player info={info} />
      </PlayerContext.Provider>,
      this.contentEl,
    );
  }
  async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    super.onClose();
  }

  async onRename(file: TFile) {
    this.events.trigger(
      "file-loaded",
      (await getMediaInfo(
        { type: "internal", file, hash: "" },
        this.app,
      )) as InternalMediaInfo,
    );
    return super.onRename(file);
  }

  static displayInEl(
    info: InternalMediaInfo,
    app: App,
    containerEl: HTMLElement,
    inEditor = false,
  ): PlayerRenderChild {
    return new PlayerRenderChild(info, app, containerEl, inEditor);
  }
}

const registerPlayerEvents = (component: PlayerComponent) => {
  const { events } = component;
  [
    events.on("player-init", (player) => {
      component.player = player;
      component.keymap = getPlayerKeymaps(component.scope, player);
    }),
    events.on("player-destroy", () => {
      component.player = null;
      if (component.keymap) {
        component.keymap.forEach((k) => component.scope.unregister(k));
        component.keymap = null;
      }
    }),
    events.on("screenshot", async (data) => {
      const blob = await data;
      // TODO
    }),
  ].forEach(component.registerEvent.bind(component));
};

export class PlayerRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  player: MediaProviderElement | null = null;
  scope = new Scope(this.app.scope);
  events = new MediaViewEvents();
  keymap: KeymapEventHandler[] | null = null;

  constructor(
    private info: InternalMediaInfo,
    private app: App,
    containerEl: HTMLElement,
    private inEditor: boolean,
  ) {
    super(containerEl);
    registerPlayerEvents(this);
  }

  async onload() {
    await wait(0);
    ReactDOM.render(
      <PlayerContext.Provider
        value={{
          app: this.app,
          inEditor: this.inEditor,
          events: this.events,
          containerEl: this.containerEl,
        }}
      >
        <Player
          info={this.info}
          controls={ShowControls.full}
          onFocus={this.inEditor ? undefined : this.pushScope.bind(this)}
          onBlur={this.inEditor ? undefined : this.popScope.bind(this)}
        />
      </PlayerContext.Provider>,

      this.containerEl,
    );
  }
  pushScope() {
    this.app.keymap.pushScope(this.scope);
  }
  popScope() {
    this.app.keymap.popScope(this.scope);
  }
  onunload(): void {
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
