import type { ViewStateResult } from "obsidian";
import type { MediaRemoteViewState } from "./base";
import { MediaRemoteView } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_EMBED_VIEW_TYPE = "mx-embed";

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
      this.store.setState({ source: { src: state.source } });
    }
    return super.setState(state, result);
  }
  getState(): MediaRemoteViewState {
    const fromStore = this.store.getState();
    const state = super.getState();
    return {
      ...state,
      source: fromStore.source?.src,
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
