import type { ViewStateResult } from "obsidian";
import { matchHostForEmbed } from "@/web/match-embed";
import type { MediaRemoteViewState } from "./base";
import { MediaRemoteView } from "./base";
import { MEDIA_EMBED_VIEW_TYPE } from "./view-type";

export type MediaEmbedViewState = MediaRemoteViewState;

export const hostTitleMap: Record<string, string> = {
  "video/vimeo": "Vimeo",
  "video/youtube": "YouTube",
};

export class MediaEmbedView extends MediaRemoteView {
  async setState(
    state: MediaRemoteViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      const urlInfo = matchHostForEmbed(state.source);
      if (!urlInfo) {
        console.warn("Invalid URL", state.source);
        this._source = null;
      } else {
        this._source = state.source;
        this.store.setState({ source: { src: urlInfo.source.href } });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaRemoteViewState {
    const state = super.getState();
    return {
      ...state,
      source: this._source,
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
  getViewType(): string {
    return MEDIA_EMBED_VIEW_TYPE;
  }
}
