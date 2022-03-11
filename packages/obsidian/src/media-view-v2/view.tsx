import type { AudioPlayerElement, VideoPlayerElement } from "@vidstack/player";
import {
  App,
  MarkdownRenderChild,
  Scope,
  TFile,
  View,
  WorkspaceLeaf,
} from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import { getLink, InternalMediaInfo } from "../base/media-info";
import Player from "./player";

export const VIEW_TYPE = "media-view-v2";
export default class MediaView extends View {
  player: VideoPlayerElement | AudioPlayerElement | null = null;
  _scope: Scope;
  // no need to manage this manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  get scope() {
    return this._scope;
  }
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this._scope = getPlayerKeyboardScope(new Scope(this.app.scope), this);
  }
  getViewType(): string {
    return VIEW_TYPE;
  }
  getDisplayText(): string {
    return "media";
  }
  protected async onOpen() {
    ReactDOM.render(
      <Player
        src={
          new URL(
            `app://local/%2FUsers%2Faidenlx%2FDocuments%2FVaults%2FMed%2F_%E9%99%84%E4%BB%B6%2F%E8%A1%80%E5%8E%8B%E6%B5%8B%E9%87%8F%2FS2_9.mp4`,
          )
        }
        view={this}
      />,
      this.containerEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }

  static displayInEl(
    info: InternalMediaInfo,
    app: App,
    containerEl: HTMLElement,
  ): PlayerRenderChild {
    return new PlayerRenderChild(info, app, containerEl);
  }
}

const getPlayerKeyboardScope = (
  scope: Scope,
  rec: Record<"player", VideoPlayerElement | AudioPlayerElement | null>,
) => {
  const toRegister: Parameters<Scope["register"]>[] = [
    [[], "ArrowLeft", () => ((rec.player!.currentTime -= 5), false)],
    [[], "ArrowRight", () => ((rec.player!.currentTime += 5), false)],
    [[], "ArrowUp", () => ((rec.player!.volume += 0.1), false)],
    [[], "ArrowDown", () => ((rec.player!.volume -= 0.1), false)],
    [
      [],
      " ",
      () => (
        rec.player!.paused ? rec.player!.play() : rec.player!.pause(), false
      ),
    ],
  ];
  for (const params of toRegister) {
    scope.register(...params);
  }
  return scope;
};

export class PlayerRenderChild extends MarkdownRenderChild {
  player: VideoPlayerElement | AudioPlayerElement | null = null;

  public inEditor = false;

  constructor(
    private info: InternalMediaInfo,
    private app: App,
    containerEl: HTMLElement,
  ) {
    super(containerEl);
  }
  scope = getPlayerKeyboardScope(new Scope(this.app.scope), this);
  onload(): void {
    ReactDOM.render(
      <Player
        src={getLink(this.info, this.app.vault)}
        view={this}
        nativeControls={this.inEditor}
        onFocus={this.inEditor ? undefined : this.pushScope.bind(this)}
        onBlur={this.inEditor ? undefined : this.popScope.bind(this)}
      />,
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
