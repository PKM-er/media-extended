import { TFile } from "obsidian";
import type { AudioFileView, VideoFileView } from "@/media-view/file-view";
import type { MediaEmbedView } from "@/media-view/iframe-view";
import type { AudioUrlView, VideoUrlView } from "@/media-view/url-view";
import {
  isMediaFileViewType,
  isMediaUrlViewType,
  MEDIA_EMBED_VIEW_TYPE,
  MEDIA_WEBPAGE_VIEW_TYPE,
} from "@/media-view/view-type";
import type { MediaWebpageView } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { parseUrl } from "./note-index/url-info";
import { saveScreenshot } from "./timestamp/screenshot";
import { takeTimestamp } from "./timestamp/timestamp";

export function handleMediaNote(this: MxPlugin) {
  const { workspace } = this.app;
  this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file, _source, _leaf) => {
      if (!(file instanceof TFile)) return;
      const mediaInfo = this.mediaNote.findMedia(file);
      if (!mediaInfo) return;
      menu.addItem((item) =>
        item
          .setSection("view")
          .setIcon("play")
          .setTitle("Open linked media")
          .onClick(() => this.leafOpener.openMedia(mediaInfo)),
      );
    }),
  );
  this.addCommand({
    id: "take-timestamp-view",
    name: "Take timstamp on current media",
    icon: "star",
    checkCallback: (checking) => {
      // eslint-disable-next-line deprecation/deprecation
      const leaf = workspace.activeLeaf;
      if (!leaf) return false;
      const view = leaf.view;
      const viewType = view.getViewType();
      if (isMediaFileViewType(viewType)) {
        if (checking) return true;
        const fileView = view as VideoFileView | AudioFileView;
        takeTimestamp(fileView, () => fileView.getMediaInfo());
      } else if (
        isMediaUrlViewType(viewType) ||
        MEDIA_EMBED_VIEW_TYPE === viewType ||
        MEDIA_WEBPAGE_VIEW_TYPE === viewType
      ) {
        if (checking) return true;
        takeTimestamp(
          view as
            | VideoUrlView
            | AudioUrlView
            | MediaWebpageView
            | MediaEmbedView,
          (player) => parseUrl(player.store.getState().source?.original),
        );
      }
    },
  });
  this.addCommand({
    id: "save-screenshot-view",
    name: "Save screenshot on current media",
    icon: "camera",
    checkCallback: (checking) => {
      // eslint-disable-next-line deprecation/deprecation
      const leaf = workspace.activeLeaf;
      if (!leaf) return false;
      const view = leaf.view;
      const viewType = view.getViewType();
      if (isMediaFileViewType(viewType)) {
        if (checking) return true;
        const fileView = view as VideoFileView | AudioFileView;
        saveScreenshot(fileView, () => fileView.getMediaInfo());
      } else if (
        isMediaUrlViewType(viewType) ||
        MEDIA_EMBED_VIEW_TYPE === viewType ||
        MEDIA_WEBPAGE_VIEW_TYPE === viewType
      ) {
        if (checking) return true;
        saveScreenshot(
          view as
            | VideoUrlView
            | AudioUrlView
            | MediaWebpageView
            | MediaEmbedView,
          (player) => parseUrl(player.store.getState().source?.original),
        );
      }
    },
  });
}
