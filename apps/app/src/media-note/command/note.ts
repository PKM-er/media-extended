import {
  type MarkdownView,
  type App,
  type Editor,
  type TFile,
  type WorkspaceLeaf,
  Notice,
} from "obsidian";
import type { MediaView } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import { byActiveTime } from "../leaf-open";
import {
  copyScreenshot,
  saveScreenshot,
  validateProvider,
} from "../timestamp/screenshot";
import { takeTimestamp } from "../timestamp/timestamp";
import { openOrCreateMediaNote } from "../timestamp/utils";
import type { MediaViewCallback } from "./utils";
import { addMediaViewCommand } from "./utils";

export function registerNoteCommands(plugin: MxPlugin) {
  let prevTarget: TFile | null = null;
  addMediaViewCommand(
    {
      id: "copy-screenshot",
      name: "Copy screenshot",
      icon: "focus",
      playerCheckCallback(checking, view) {
        if (checking) return true;
        const player = validateProvider(view);
        if (!player) return;
        copyScreenshot(player);
      },
      noteCheckCallback: basicLogic((view) => {
        const player = validateProvider(view);
        if (!player) return;
        copyScreenshot(player);
      }).noteCheckCallback,
    },
    plugin,
  );
  addMediaViewCommand(
    {
      id: "take-timestamp",
      name: "Take timestamp",
      icon: "star",
      menu: true,
      section: "selection-link",
      ...basicLogic(async (p, ctx) => {
        const prev = prevTarget;
        prevTarget = ctx.file;
        if (
          (await takeTimestamp(p, ctx)) &&
          ctx.from === "player" &&
          prev !== ctx.file
        ) {
          new Notice(`Timestamp taken in "${ctx.file.basename}"`);
        }
      }),
    },
    plugin,
  );
  addMediaViewCommand(
    {
      id: "save-screenshot",
      name: "Save screenshot",
      icon: "camera",
      section: "selection-link",
      menu: true,
      ...basicLogic(async (p, ctx) => {
        const prev = prevTarget;
        prevTarget = ctx.file;
        if (
          (await saveScreenshot(p, ctx)) &&
          ctx.from === "player" &&
          prev !== ctx.file
        ) {
          new Notice(`Taking screenshot in "${ctx.file.basename}"`);
        }
      }),
    },
    plugin,
  );
  addMediaViewCommand(
    {
      id: "take-timestamp-media-note",
      name: "Take timestamp in media note",
      icon: "star",
      menu: true,
      section: "selection-link",
      playerCheckCallback(checking, view) {
        const mediaInfo = view.getMediaInfo();
        if (!mediaInfo) return false;
        if (checking) return true;
        openOrCreateMediaNote(mediaInfo, view).then((ctx) =>
          takeTimestamp(view, ctx),
        );
      },
    },
    plugin,
  );
  addMediaViewCommand(
    {
      id: "save-screenshot-media-note",
      name: "Save screenshot in media note",
      icon: "camera",
      section: "selection-link",
      menu: true,
      playerCheckCallback(checking, view) {
        const mediaInfo = view.getMediaInfo();
        if (!mediaInfo) return false;
        if (checking) return true;
        openOrCreateMediaNote(mediaInfo, view).then((ctx) =>
          saveScreenshot(view, ctx),
        );
      },
    },
    plugin,
  );

  function basicLogic(
    action: (
      playerComponent: MediaView,
      ctx: {
        file: TFile;
        editor: Editor;
        from: "player" | "note";
      },
    ) => any,
  ): MediaViewCallback {
    return {
      playerCheckCallback: (checking, view) => {
        // find last active note in editor mode and inset the note
        const active = getMostRecentEditorLeaf(plugin.app);
        if (!active) {
          if (checking) return false;
          new Notice("No active note can be edited");
          return;
        }
        if (checking) return true;
        (async () => {
          // keep notice in same window with note
          const prevActiveDoc = window.activeDocument;
          window.activeDocument = active.containerEl.doc;
          await action(view, {
            file: active.view.file,
            editor: active.view.editor,
            from: "player",
          });
          window.activeDocument = prevActiveDoc;
        })();
      },
      noteCheckCallback: (checking, view, { isMediaNote, ...ctx }) => {
        let _view: Promise<MediaView>;
        if (!view) {
          if (!isMediaNote) return false;
          if (checking) return true;
          _view = plugin.leafOpener
            .openMedia(isMediaNote, undefined, { fromUser: true })
            .then((l) => l.view);
        } else {
          if (checking) return true;
          plugin.app.workspace.revealLeaf(view.leaf);
          _view = Promise.resolve(view);
        }
        _view.then(async (v) => {
          await action(v, { ...ctx, from: "note" });
        });
      },
    };
  }
}

function getMostRecentEditorLeaf(app: App) {
  const leaf = app.workspace
    .getLeavesOfType("markdown")
    .filter((l) => {
      const view = l.view as MarkdownView;
      return view.file && view.getMode() === "source";
    })
    .sort(byActiveTime);

  return (
    (leaf[0] as
      | (WorkspaceLeaf & { view: MarkdownView & { file: TFile } })
      | undefined) ?? null
  );
}
