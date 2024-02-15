import type { Editor, TFile } from "obsidian";
import type { MediaView } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import { saveScreenshot } from "../timestamp/screenshot";
import { takeTimestamp } from "../timestamp/timestamp";
import { openOrCreateMediaNote } from "../timestamp/utils";
import type { MediaViewCallback } from "./utils";
import { addMediaViewCommand } from "./utils";

export function registerNoteCommands(plugin: MxPlugin) {
  addMediaViewCommand(
    {
      id: "take-timestamp",
      name: "Take timestamp",
      icon: "star",
      menu: true,
      section: "selection-link",
      ...logic(takeTimestamp),
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
      ...logic(saveScreenshot),
    },
    plugin,
  );

  function logic(
    action: (
      playerComponent: MediaView,
      ctx: {
        file: TFile;
        editor: Editor;
      },
    ) => any,
  ): MediaViewCallback {
    return {
      playerCheckCallback: (checking, view) => {
        const mediaInfo = view.getMediaInfo();
        if (!mediaInfo) return false;
        if (checking) return true;
        openOrCreateMediaNote(mediaInfo, view).then((ctx) => action(view, ctx));
      },
      noteCheckCallback: (checking, view, { isMediaNote, ...ctx }) => {
        let _view: Promise<MediaView>;
        if (!view) {
          if (!isMediaNote) return false;
          if (checking) return true;
          _view = plugin.leafOpener
            .openMedia(isMediaNote, undefined)
            .then((l) => l.view);
        } else {
          if (checking) return true;
          plugin.app.workspace.revealLeaf(view.leaf);
          _view = Promise.resolve(view);
        }
        _view.then((v) => action(v, ctx));
      },
    };
  }
}
