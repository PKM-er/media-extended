import type { ViewStateResult } from "obsidian";
import { handlePaneMigration } from "@/lib/window-migration";
import { MediaHost, mediaHostDisplayName } from "@/web/url-match/supported";
import type { MediaRemoteViewState } from "./remote-view";
import { MediaRemoteView } from "./remote-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "./view-type";

export type MediaWebpageViewState = MediaRemoteViewState;

export class MediaWebpageView extends MediaRemoteView {
  onload(): void {
    super.onload();
    this.registerRemoteTitleChange();
    handlePaneMigration(this, () => this.render());
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
    const { source } = this.store.getState();
    if (!source?.url) return MediaHost.Generic;
    return source.url.type;
  }
  getDisplayText(): string {
    if (!this.playerTitle) return "Webpage";
    return `${this.playerTitle} - ${mediaHostDisplayName[this.getHost()]}`;
  }

  async setState(
    state: MediaWebpageViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      const url = this.plugin.resolveUrl(state.source);
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
    const url = this.store.getState().source?.url;
    return {
      ...state,
      source: url ? url.jsonState.source : state.source,
    };
  }
}
