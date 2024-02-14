import type { ViewStateResult } from "obsidian";
import { MediaURL } from "@/web/url-match";
import { MediaHost, mediaHostDisplayName } from "@/web/url-match/supported";
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
    if (host === MediaHost.Generic) {
      return "globe";
    }
    return host;
  }

  getHost(): MediaHost {
    const { source } = this.getState();
    if (!source) return MediaHost.Generic;
    return source.type;
  }
  getDisplayText(): string {
    if (!this.playerTitle) return "Webpage";
    return `${this.playerTitle} - ${mediaHostDisplayName[this.getHost()]}`;
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
        this.store.getState().setSource(url, { enableWebview: true });
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
