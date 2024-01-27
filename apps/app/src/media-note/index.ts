import { TFile } from "obsidian";
import type MxPlugin from "@/mx-main";
import { registerControlCommands, registerNoteCommands } from "./command";

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
          .onClick(() => this.leafOpener.openMedia(mediaInfo)),
      );
    }),
  );
  registerNoteCommands(this);
  registerControlCommands(this);
}
