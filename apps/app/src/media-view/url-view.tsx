import type { MediaURL } from "@/info/media-url";
import { MediaRemoteView } from "./remote-view";
import type { MediaRemoteViewState } from "./remote-view";
import type { MediaUrlViewType } from "./view-type";
import { MEDIA_URL_VIEW_TYPE } from "./view-type";

export type MediaUrlViewState = MediaRemoteViewState;

abstract class MediaUrlView extends MediaRemoteView {
  abstract getViewType(): MediaUrlViewType;
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

  async setSource(url: MediaURL) {
    const state = await super.setSource(url);
    state.title = true;
    return state;
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
  async setSource(url: MediaURL) {
    const state = await super.setSource(url);
    state.title = true;
    return state;
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
