import type { ViewStateResult } from "obsidian";
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
    if (typeof state.source === "string") {
      const url = this.plugin.resolveUrl(state.source);
      if (!url) {
        console.warn("Invalid URL", state.source);
      } else {
        this.store.getState().setSource(url, { title: true });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaUrlViewState {
    const state = super.getState() as MediaUrlViewState;
    const url = this.store.getState().source?.url;
    return {
      ...state,
      source: url ? url.jsonState.source : state.source,
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
    return this.playerTitle || "Video";
  }
}

export class AudioUrlView extends MediaUrlView {
  getIcon(): string {
    return "file-audio";
  }
  getDisplayText(): string {
    return this.playerTitle || "Audio";
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
