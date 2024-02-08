import type { ViewStateResult } from "obsidian";
import { MediaURL } from "@/web/url-match";
import type { MediaRemoteViewState } from "./remote-view";
import { MediaRemoteView } from "./remote-view";
import type { MediaEmbedViewType } from "./view-type";
import { MEDIA_EMBED_VIEW_TYPE } from "./view-type";

export type MediaEmbedViewState = MediaRemoteViewState;

export const hostTitleMap: Record<string, string> = {
  "video/vimeo": "Vimeo",
  "video/youtube": "YouTube",
};

export class MediaEmbedView extends MediaRemoteView {
  onload(): void {
    super.onload();
    this.registerRemoteTitleChange();
  }
  async setState(
    state: MediaRemoteViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string" || state.source instanceof URL) {
      const url = MediaURL.create(state.source);
      if (!url) {
        console.warn("Invalid URL", state.source);
      } else {
        this.store.setState({ source: { url } });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaRemoteViewState {
    const state = super.getState() as MediaRemoteViewState;
    return {
      ...state,
      source: this.store.getState().source?.url,
    };
  }
  getDisplayText(): string {
    const source = hostTitleMap[this._sourceType] ?? "Embed";
    if (!this._title) return source;
    return `${this._title} - ${source}`;
  }
  getIcon(): string {
    return this._sourceType === "video/youtube" ? "youtube" : "video";
  }
  getViewType(): MediaEmbedViewType {
    return MEDIA_EMBED_VIEW_TYPE;
  }
}
