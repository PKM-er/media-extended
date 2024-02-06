import { TFile } from "obsidian";
import type MxPlugin from "@/mx-main";
import { registerControlCommands } from "./command/media";
import { registerNoteCommands } from "./command/note";

export function handleMediaNote(this: MxPlugin) {
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
          .onClick(() => this.leafOpener.openMedia(mediaInfo, "split")),
      );
    }),
  );
  registerNoteCommands(this);
  registerControlCommands(this);
}
