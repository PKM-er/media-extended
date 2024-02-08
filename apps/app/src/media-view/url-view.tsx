import type { ViewStateResult } from "obsidian";
import { MediaURL } from "@/web/url-match";
import { titleFromUrl } from "./base";
import { MediaRemoteView } from "./remote-view";
import type { MediaRemoteViewState } from "./remote-view";
import type { MediaUrlViewType } from "./view-type";
import { MEDIA_URL_VIEW_TYPE } from "./view-type";

export type MediaUrlViewState = MediaRemoteViewState;

abstract class MediaUrlView extends MediaRemoteView {
  abstract getViewType(): MediaUrlViewType;

  async setState(
    state: MediaUrlViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string" || state.source instanceof URL) {
      const url = MediaURL.create(state.source);
      if (!url) {
        console.warn("Invalid URL", state.source);
      } else {
        this._title = titleFromUrl(url.source.href);
        this.store.setState({
          source: { url },
          title: this._title,
        });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaUrlViewState {
    const state = super.getState() as MediaUrlViewState;
    return {
      ...state,
      source: this.store.getState().source?.url,
    };
  }
}

export class VideoUrlView extends MediaUrlView {
  getIcon(): string {
    return "file-video";
  }
  getViewType() {
    return MEDIA_URL_VIEW_TYPE.video;
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Video";
    return title;
  }
}

export class AudioUrlView extends MediaUrlView {
  getIcon(): string {
    return "file-audio";
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Audio";
    return title;
  }
  getViewType() {
    return MEDIA_URL_VIEW_TYPE.audio;
  }
}

// function revertFileUrl(url?: string): string | undefined {
//   if (!url) return url;
//   if (url.startsWith(Platform.resourcePathPrefix)) {
//     return (
//       "file:///" + url.slice(Platform.resourcePathPrefix.length).split("?")[0]
//     );
//   }
//   return url;
// }
