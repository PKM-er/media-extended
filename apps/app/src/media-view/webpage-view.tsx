import type { ViewStateResult } from "obsidian";
import {
  SupportedWebHost,
  matchHostForWeb,
  webHostDisplayName,
} from "@/web/match";
import type { MediaRemoteViewState } from "./base";
import { MediaRemoteView } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_WEBPAGE_VIEW_TYPE = "mx-webpage";

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
      this.store.setState({ source: { src: `webview::${state.source}` } });
    }
    return super.setState(state, result);
  }
  getState(): MediaWebpageViewState {
    const fromStore = this.store.getState();
    const state = super.getState();
    return {
      ...state,
      source: fromStore.source?.src.replace(/^webview::/, ""),
    };
  }
}
