import type { TFile } from "obsidian";
import type { AudioFileView, VideoFileView } from "@/media-view/file-view";
import { isMediaFileViewType } from "@/media-view/file-view";
import type { MediaEmbedView } from "@/media-view/iframe-view";
import { MEDIA_EMBED_VIEW_TYPE } from "@/media-view/iframe-view";
import type { AudioUrlView, VideoUrlView } from "@/media-view/url-view";
import { isMediaUrlViewType } from "@/media-view/url-view";
import type { MediaWebpageView } from "@/media-view/webpage-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { takeTimestampOnFile, takeTimestampOnUrl } from "./timestamp";
import { noteUtils } from "./utils";

export function handleMediaNote(this: MxPlugin) {
  const { openMedia, getMediaInfo } = noteUtils(this.app);
  const { workspace } = this.app;
  this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file, _source, _leaf) => {
      const mediaInfo = getMediaInfo(file);
      if (!mediaInfo) return;
      menu.addItem((item) =>
        item
          .setSection("view")
          .setIcon("play")
          .setTitle("Open linked media")
          .onClick(() => openMedia(mediaInfo, file as TFile)),
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
        const takeTimestamp = takeTimestampOnFile(
          view as VideoFileView | AudioFileView,
          (player) => player.file,
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
          (player) => player.source,
        );
        takeTimestamp();
      }
    },
  });
}
