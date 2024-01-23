import type { Menu, ViewStateResult } from "obsidian";
import type { UrlMediaInfo } from "@/media-note/note-index/url-info";
import { parseUrl } from "@/media-note/note-index/url-info";
import {
  SupportedWebHost,
  matchHostForWeb,
  webHostDisplayName,
} from "@/web/match-webpage";
import type { MediaRemoteViewState } from "./base";
import { MediaRemoteView } from "./base";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "./view-type";

export type MediaWebpageViewState = MediaRemoteViewState;

export class MediaWebpageView extends MediaRemoteView {
  getViewType(): string {
    return MEDIA_WEBPAGE_VIEW_TYPE;
  }
  getIcon(): string {
    const host = this.getHost();
    if (host === SupportedWebHost.Generic) {
      return "globe";
    }
    return host;
  }

  getHost(): SupportedWebHost {
    const { source } = this.getState();
    if (!source) return SupportedWebHost.Generic;
    return matchHostForWeb(source)?.type ?? SupportedWebHost.Generic;
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Webpage";
    return `${title} - ${webHostDisplayName[this.getHost()]}`;
  }

  onPaneMenu(menu: Menu, _source: string): void {
    const controls = this.store.getState().controls ?? true;
    menu.addItem((item) => {
      item
        .setTitle(
          controls ? "Show website native controls" : "Hide website controls",
        )
        .setIcon("sliders-horizontal")
        .onClick(() => {
          this.store.getState().toggleControls(!controls);
        });
    });

    let urlInfo: UrlMediaInfo | null;
    if (this.source && (urlInfo = parseUrl(this.source))) {
      const url = urlInfo.source;
      menu.addItem((item) =>
        item
          .setTitle("Open in browser")
          .setIcon("globe")
          .onClick(() => {
            window.open(url);
          }),
      );
    }
  }

  async setState(
    state: MediaWebpageViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      const urlInfo = matchHostForWeb(state.source);
      if (!urlInfo) {
        console.warn("Invalid URL", state.source);
        this._source = null;
      } else {
        this._source = state.source;
        this.store.setState({
          source: { src: `webview::${btoa(urlInfo.source.href)}` },
        });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaWebpageViewState {
    const state = super.getState();
    return {
      ...state,
      source: this._source,
    };
  }
}
