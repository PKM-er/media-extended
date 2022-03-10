import type { AudioPlayerElement, VideoPlayerElement } from "@vidstack/player";
import { Scope, View, WorkspaceLeaf } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import Player from "./player";

export const VIEW_TYPE = "media-view-v2";
export default class MediaView extends View {
  player: VideoPlayerElement | AudioPlayerElement | null = null;
  _scope: Scope;
  /** implicitly called by leaf  */
  get scope() {
    return this._scope;
  }
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this._scope = new Scope(this.app.scope);
    this.registerKeyboardEvents();
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
    //
    // no need for this when it's inside a WorkspaceLeaf, as it's automatically pushed
    //
    // this.registerDomEvent(this.containerEl, "focusin", (evt) => {
    //   console.log("in", evt);
    //   this.pushScope();
    // });
    // this.registerDomEvent(this.containerEl, "focusout", (evt) => {
    //   console.log("out", evt);
    //   this.popScope();
    // });
    // this.pushScope();
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl);
    // this.popScope();
  }

  // pushScope() {
  //   this.app.keymap.pushScope(this.scope);
  // }
  // popScope() {
  //   this.app.keymap.popScope(this.scope);
  // }
  registerKeyboardEvents() {
    const toRegister: Parameters<Scope["register"]>[] = [
      [[], "ArrowLeft", () => ((this.player!.currentTime -= 5), false)],
      [[], "ArrowRight", () => ((this.player!.currentTime += 5), false)],
      [[], "ArrowUp", () => ((this.player!.volume += 0.1), false)],
      [[], "ArrowDown", () => ((this.player!.volume -= 0.1), false)],
      [
        [],
        " ",
        () => (
          this.player!.paused ? this.player!.play() : this.player!.pause(),
          false
        ),
      ],
    ];
    for (const params of toRegister) {
      this._scope.register(...params);
    }
  }
}
