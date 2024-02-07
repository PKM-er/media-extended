import type { ViewStateResult } from "obsidian";
import { matchHostForUrl } from "@/web/match-url";
import { MediaRemoteView, titleFromUrl } from "./base";
import type { MediaRemoteViewState } from "./base";
import type { MediaUrlViewType } from "./view-type";
import { MEDIA_URL_VIEW_TYPE } from "./view-type";

export type MediaUrlViewState = MediaRemoteViewState;

abstract class MediaUrlView extends MediaRemoteView {
  abstract getViewType(): MediaUrlViewType;

  async setState(
    state: MediaUrlViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      const info = matchHostForUrl(state.source, this.plugin);
      if (!info) {
        console.warn("Invalid URL", state.source);
      } else {
        this._title = titleFromUrl(info.source.href);
        this.store.setState({
          source: {
            src: info.source.href,
            original: state.source,
            viewType: this.getViewType(),
          },
          title: this._title,
        });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaUrlViewState {
    const state = super.getState();
    return {
      ...state,
      source: this.store.getState().source?.original,
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
