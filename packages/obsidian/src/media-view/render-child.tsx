import { setPlayerKeymaps } from "@feature/keyboard-control";
import { Player } from "@player";
import { createStore } from "@player/store/ob-store";
import MediaExtended from "@plugin";
import { AppThunk } from "mx-store";
import { MarkdownRenderChild, Scope } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import { PlayerComponent } from "./common";

export default class PlayerRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  scope;
  store;
  set port(port: MessagePort | null) {
    this.store.msgHandler.port = port;
  }
  get port() {
    return this.store.msgHandler.port;
  }

  get app() {
    return this.plugin.app;
  }

  constructor(
    initAction: AppThunk,
    public plugin: MediaExtended,
    containerEl: HTMLElement,
    private inEditor: boolean,
  ) {
    super(containerEl);
    const store = createStore(
      `media embed (${inEditor ? "live" : "read"}) ` + Date.now(),
    );
    store.dispatch(initAction);
    this.store = store;
    this.scope = new Scope(this.app.scope);
    setPlayerKeymaps(this);
  }

  async onload() {
    ReactDOM.render(
      <Player
        store={this.store}
        inEditor={this.inEditor}
        plugin={this.plugin}
        onFocus={this.pushScope.bind(this)}
        onBlur={this.popScope.bind(this)}
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
    this.popScope();
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
