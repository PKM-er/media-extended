import type { ViewStateResult } from "obsidian";
import { matchHostForEmbed } from "@/web/match-embed";
import type { MediaRemoteViewState } from "./base";
import { MediaRemoteView } from "./base";
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
    if (typeof state.source === "string") {
      const urlInfo = matchHostForEmbed(state.source);
      if (!urlInfo) {
        console.warn("Invalid URL", state.source);
      } else {
        this.store.setState({
          source: {
            src: urlInfo.source.href,
            original: state.source,
            viewType: this.getViewType(),
          },
        });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaRemoteViewState {
    const state = super.getState();
    return {
      ...state,
      source: this.store.getState().source?.original,
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
