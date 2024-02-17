import { getTracksLocal } from "@/lib/subtitle";
import type { MediaURL } from "@/web/url-match";
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
    const defaultLang = this.plugin.settings.getState().getDefaultLang();
    const textTracks = await getTracksLocal(url, defaultLang).catch((e) => {
      console.error("Failed to get text tracks", e);
      return [];
    });
    this.store.getState().setSource(url, {
      title: true,
      textTracks,
      type: "video/mp4",
    });
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
    this.store.getState().setSource(url, {
      title: true,
      type: "audio/mp3",
    });
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
