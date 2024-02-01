import type { MediaPlayerInstance } from "@vidstack/react";
import type { Editor, WorkspaceLeaf, MarkdownFileInfo, App } from "obsidian";
import { MarkdownView } from "obsidian";
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

const commands: Controls[] = [
  {
    id: "toggle-play",
    label: "Play/pause",
    icon: "play",
    action: (media) => {
      media.paused = !media.paused;
    },
  },
  ...[5, 30].flatMap((sec): Controls[] => [
    {
      id: `forward-${sec}s`,
      label: `Forward ${sec}s`,
      icon: "forward",
      action: (media) => {
        media.currentTime += sec;
      },
      repeat: true,
    },
    {
      id: `rewind-${sec}s`,
      label: `Rewind ${sec}s`,
      icon: "rewind",
      action: (media) => {
        media.currentTime -= sec;
      },
      repeat: true,
    },
  ]),
  {
    id: "toggle-mute",
    label: "Mute/unmute",
    icon: "volume-x",
    action: (media) => {
      media.muted = !media.muted;
    },
  },
  {
    id: "toggle-fullscreen",
    label: "Enter/exit fullscreen",
    icon: "expand",
    check: (media) => media.state.canFullscreen,
    action: (media) => {
      if (media.state.fullscreen) {
        media.exitFullscreen();
      } else {
        media.enterFullscreen();
      }
    },
  },
];

export function registerNoteCommands(plugin: MxPlugin) {
  const { workspace } = plugin.app;

  plugin.addCommand({
    id: "take-timestamp",
    name: "Take timstamp on active/current media",
    icon: "star",
    checkCallback: checkCallbacks(
      (checking) => {
        // eslint-disable-next-line deprecation/deprecation
        const mediaView = getMediaView(workspace.activeLeaf);
        if (!mediaView) return false;
        if (checking) return true;
        takeTimestamp(mediaView.view, mediaView.getInfo);
      },
      (checking, editor, ctx) => {
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
      plugin.app,
    ),
  });

  plugin.addCommand({
    id: "save-screenshot",
    name: "Save screenshot on active/current media",
    icon: "camera",
    checkCallback: checkCallbacks(
      (checking) => {
        // eslint-disable-next-line deprecation/deprecation
        const mediaView = getMediaView(workspace.activeLeaf);
        if (!mediaView) return false;
        if (checking) return true;
        saveScreenshot(mediaView.view, mediaView.getInfo);
      },
      (checking, editor, ctx) => {
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
      plugin.app,
    ),
  });
}

interface Controls {
  id: string;
  label: string;
  icon: string;
  repeat?: boolean;
  check?: (media: MediaPlayerInstance) => boolean;
  action: (media: MediaPlayerInstance) => void;
}

export function registerControlCommands(plugin: MxPlugin) {
  const { workspace } = plugin.app;

  commands.forEach(({ id, label, icon, action: _action, repeat, check }) => {
    function action(
      checking: boolean,
      mediaView: ReturnType<typeof getMediaView>,
    ) {
      if (!mediaView) return false;
      const player = mediaView.view.store.getState().player;
      if (!player) return false;
      if (check && !check(player)) return false;
      if (checking) return true;
      _action(player);
    }
    plugin.addCommand({
      id,
      name: `${label} on active/linked media`,
      icon,
      repeatable: repeat,
      checkCallback: checkCallbacks(
        (checking) => {
          // eslint-disable-next-line deprecation/deprecation
          const mediaView = getMediaView(workspace.activeLeaf);
          return action(checking, mediaView);
        },
        (checking, _, ctx) => {
          if (!ctx.file) return false;
          const mediaInfo = plugin.mediaNote.findMedia(ctx.file);
          if (!mediaInfo) return false;
          const opened = plugin.leafOpener.findExistingPlayer(mediaInfo);
          const mediaView = getMediaView(opened);
          return action(checking, mediaView);
        },
        plugin.app,
      ),
    });
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

function checkCallbacks(
  onRegular: (checking: boolean) => boolean | void,
  onEditor: (
    checking: boolean,
    editor: Editor,
    ctx: MarkdownView | MarkdownFileInfo,
  ) => boolean | void,
  app: App,
) {
  return (checking: boolean): boolean | void => {
    const activeEditor = app.workspace.activeEditor;
    if (!activeEditor) return onRegular(checking);
    // from app.js
    if ((activeEditor as MarkdownView).getMode() !== "preview") {
      if (activeEditor instanceof MarkdownView) {
        if ((activeEditor as any).inlineTitleEl.isActiveElement()) return;
      }
      onEditor(checking, activeEditor.editor!, activeEditor);
    }
  };
}
