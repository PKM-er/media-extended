import type { ViewStateResult } from "obsidian";
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
