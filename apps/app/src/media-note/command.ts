import type { WorkspaceLeaf } from "obsidian";
import type { AudioFileView, VideoFileView } from "@/media-view/file-view";
import type { RemoteMediaView } from "@/media-view/view-type";
import {
  isMediaFileViewType,
  isRemoteMediaViewType,
} from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import { parseUrl } from "./note-index/url-info";
import { saveScreenshot } from "./timestamp/screenshot";
import { takeTimestamp } from "./timestamp/timestamp";

export function registerNoteCommands(plugin: MxPlugin) {
  const { workspace } = plugin.app;

  plugin.addCommand({
    id: "take-timestamp-player",
    name: "Take timstamp on current media",
    icon: "star",
    checkCallback: (checking) => {
      // eslint-disable-next-line deprecation/deprecation
      const mediaView = getMediaView(workspace.activeLeaf);
      if (!mediaView) return false;
      if (checking) return true;
      takeTimestamp(mediaView.view, mediaView.getInfo);
    },
  });
  plugin.addCommand({
    id: "save-screenshot-player",
    name: "Save screenshot on current media",
    icon: "camera",
    checkCallback: (checking) => {
      // eslint-disable-next-line deprecation/deprecation
      const mediaView = getMediaView(workspace.activeLeaf);
      if (!mediaView) return false;
      if (checking) return true;
      saveScreenshot(mediaView.view, mediaView.getInfo);
    },
  });
  plugin.addCommand({
    id: "take-timestamp-view",
    name: "Take timstamp on linked media",
    icon: "star",
    editorCheckCallback: (checking, editor, ctx) => {
      if (!ctx.file) return false;
      const mediaInfo = plugin.mediaNote.findMedia(ctx.file);
      if (!mediaInfo) return false;
      const opened = plugin.leafOpener.findExistingPlayer(mediaInfo);
      const mediaView = getMediaView(opened);
      if (!mediaView) return false;
      if (checking) return true;
      takeTimestamp(mediaView.view, mediaView.getInfo, {
        file: ctx.file,
        editor,
      });
    },
  });
  plugin.addCommand({
    id: "save-screenshot-view",
    name: "Save screenshot on linked media",
    icon: "camera",
    editorCheckCallback: (checking, editor, ctx) => {
      if (!ctx.file) return false;
      const mediaInfo = plugin.mediaNote.findMedia(ctx.file);
      if (!mediaInfo) return false;
      const opened = plugin.leafOpener.findExistingPlayer(mediaInfo);
      const mediaView = getMediaView(opened);
      if (!mediaView) return false;
      if (checking) return true;
      saveScreenshot(mediaView.view, mediaView.getInfo, {
        file: ctx.file,
        editor,
      });
    },
  });
}

function getMediaView(leaf: WorkspaceLeaf | null) {
  const view = leaf?.view;
  if (!view) return null;
  const viewType = view.getViewType();
  if (isMediaFileViewType(viewType)) {
    const fileView = view as VideoFileView | AudioFileView;
    return {
      type: viewType,
      view: fileView,
      getInfo: () => fileView.getMediaInfo(),
    };
  } else if (isRemoteMediaViewType(viewType)) {
    const remoteView = view as RemoteMediaView;
    return {
      type: viewType,
      view: remoteView,
      getInfo: () => parseUrl(remoteView.store.getState().source?.original),
    };
  }
  return null;
}
