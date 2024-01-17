import { TFile } from "obsidian";
import type { AudioFileView, VideoFileView } from "@/media-view/file-view";
import { isMediaFileViewType } from "@/media-view/file-view";
import type { MediaEmbedView } from "@/media-view/iframe-view";
import { MEDIA_EMBED_VIEW_TYPE } from "@/media-view/iframe-view";
import type { AudioUrlView, VideoUrlView } from "@/media-view/url-view";
import { isMediaUrlViewType } from "@/media-view/url-view";
import type { MediaWebpageView } from "@/media-view/webpage-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { parseUrl } from "./manager/url-info";
import { takeTimestampOnFile, takeTimestampOnUrl } from "./timestamp";
import { openMedia } from "./utils";

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
          .onClick(() => openMedia(mediaInfo, this.app)),
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
        const takeTimestamp = takeTimestampOnFile(fileView, () =>
          fileView.getMediaInfo(),
        );
        takeTimestamp();
      } else if (
        isMediaUrlViewType(viewType) ||
        MEDIA_EMBED_VIEW_TYPE === viewType ||
        MEDIA_WEBPAGE_VIEW_TYPE === viewType
      ) {
        if (checking) return true;
        const takeTimestamp = takeTimestampOnUrl(
          view as
            | VideoUrlView
            | AudioUrlView
            | MediaWebpageView
            | MediaEmbedView,
          (player) => parseUrl(player.source),
        );
        takeTimestamp();
      }
    },
  });
}
