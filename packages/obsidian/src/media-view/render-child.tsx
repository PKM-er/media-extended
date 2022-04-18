import { createStore, Player } from "@player";
import { AppThunk } from "@player/store";
import MediaExtended from "@plugin";
import { MarkdownRenderChild, Scope } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import { PlayerComponent, unloadKeymap } from "./common";
import getPlayerKeymaps from "./keymap";

export default class PlayerRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  scope;
  keymap;
  store;

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
    this.store = createStore(
      `media embed (${inEditor ? "live" : "read"}) ` + Date.now(),
    );
    this.store.dispatch(initAction);
    this.scope = new Scope(this.app.scope);
    this.keymap = getPlayerKeymaps(this);
  }

  async onload() {
    ReactDOM.render(
      <Player
        store={this.store}
        inEditor={this.inEditor}
        pluginDir={this.plugin.getFullPluginDir()}
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
    unloadKeymap(this.scope, this.keymap);
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
