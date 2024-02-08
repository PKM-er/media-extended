import type { ViewStateResult } from "obsidian";
import { MediaURL } from "@/web/url-match";
import {
  SupportedMediaHost,
  mediaHostDisplayName,
} from "@/web/url-match/supported";
import type { MediaRemoteViewState } from "./remote-view";
import { MediaRemoteView } from "./remote-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "./view-type";

export type MediaWebpageViewState = MediaRemoteViewState;

export class MediaWebpageView extends MediaRemoteView {
  onload(): void {
    super.onload();
    this.registerRemoteTitleChange();
  }
  getViewType() {
    return MEDIA_WEBPAGE_VIEW_TYPE;
  }
  getIcon(): string {
    const host = this.getHost();
    if (host === SupportedMediaHost.Generic) {
      return "globe";
    }
    return host;
  }

  getHost(): SupportedMediaHost {
    const { source } = this.getState();
    if (!source) return SupportedMediaHost.Generic;
    return source.type;
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Webpage";
    return `${title} - ${mediaHostDisplayName[this.getHost()]}`;
  }

  async setState(
    state: MediaWebpageViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string" || state.source instanceof URL) {
      const url = MediaURL.create(state.source);
      if (!url) {
        console.warn("Invalid URL", state.source);
      } else {
        this.store.setState({ source: { url, enableWebview: true } });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaWebpageViewState {
    const state = super.getState() as MediaWebpageViewState;
    return {
      ...state,
      source: this.store.getState().source?.url,
    };
  }
}
