import { getPlayerKeymaps } from "@feature/keyboard-control";
import { Player } from "@player";
import { MessageHandler } from "@player/ipc/redux-sync";
import { AppThunk } from "@player/store";
import MediaExtended from "@plugin";
import { MarkdownRenderChild, Scope } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import { createStore, PlayerComponent, unloadKeymap } from "./common";

export default class PlayerRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  scope;
  keymap;
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
    private plugin: MediaExtended,
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
    this.keymap = getPlayerKeymaps(this);
  }

  async onload() {
    ReactDOM.render(
      <Player
        store={this.store}
        inEditor={this.inEditor}
        pluginDir={this.plugin.getFullPluginDir()}
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
    unloadKeymap(this.scope, this.keymap);
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
