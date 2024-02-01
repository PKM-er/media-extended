import type { MediaPlayerInstance } from "@vidstack/react";
import type { Editor, WorkspaceLeaf, MarkdownFileInfo, App } from "obsidian";
import { MarkdownView, Notice, debounce } from "obsidian";
import type { AudioFileView, VideoFileView } from "@/media-view/file-view";
import { PlaybackSpeedPrompt } from "@/media-view/menu/prompt";
import { speedOptions } from "@/media-view/menu/speed";
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
  ...speed(),
];

function speed(): Controls[] {
  // reuse notice if user is spamming speed change
  let notice: Notice | null = null;
  const hide = debounce(() => notice?.hide(), 2e3, true);
  function notify(message: string) {
    if (!notice || notice.noticeEl.isConnected === false) {
      notice = new Notice(message, 0);
    } else {
      notice.setMessage(message);
    }
    hide();
  }
  function notifyAllowDup(message: string) {
    new Notice(message, 2e3);
  }
  return [
    {
      id: "reset-speed",
      label: "Reset playback speed",
      icon: "reset",
      check: (media) => media.state.playbackRate !== 1,
      action: (media) => {
        media.playbackRate = 1;
        notifyAllowDup("Speed reset to 1x");
      },
    },
    {
      id: "increase-speed",
      label: "Increase playback speed",
      icon: "arrow-up",
      action: (media) => {
        const curr = media.playbackRate;
        if (curr >= speedOptions.last()!) {
          notifyAllowDup("Cannot increase speed further");
          return;
        }
        // find nearest speed option greater than current speed
        const next = speedOptions.find((speed) => speed > curr)!;
        media.playbackRate = next;
        notify(`Speed increased to ${next}x`);
      },
    },
    {
      id: "decrease-speed",
      label: "Decrease playback speed",
      icon: "arrow-down",
      action: (media) => {
        const curr = media.playbackRate;
        if (curr <= speedOptions.first()!) {
          notifyAllowDup("Cannot decrease speed further");
          return;
        }
        // find nearest speed option less than current speed
        const prev = speedOptions
          .slice()
          .reverse()
          .find((speed) => speed < curr)!;
        media.playbackRate = prev;
        notify(`Speed decreased to ${prev}x`);
      },
    },
    {
      id: "set-speed",
      label: "Set playback speed",
      icon: "gauge",
      action: async (media) => {
        const newSpeed = await PlaybackSpeedPrompt.run();
        if (!newSpeed) return;
        media.playbackRate = newSpeed;
        notify(`Speed set to ${newSpeed}x`);
      },
    },
  ];
}

export function registerNoteCommands(plugin: MxPlugin) {
  const { workspace } = plugin.app;

  plugin.addCommand({
    id: "take-timestamp",
    name: "Take timstamp",
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
    name: "Save screenshot",
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
      name: label,
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
