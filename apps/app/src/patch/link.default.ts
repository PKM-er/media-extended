import { around } from "monkey-around";
import { TFile, type Workspace } from "obsidian";
import type MxPlugin from "@/mx-main";

export default function patchMediaNoteLinktextOpen(this: MxPlugin) {
  const { vault } = this.app;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const plugin = this;
  this.register(
    around(this.app.workspace, {
      openLinkText: (next) =>
        function (this: Workspace, linktext, sourcePath, newLeaf, ...args) {
          const fallback = (defaultSplit = false) =>
            next.call(
              this,
              linktext,
              sourcePath,
              defaultSplit && !newLeaf ? "split" : newLeaf,
              ...args,
            );
          if (!sourcePath) return fallback();
          const note = vault.getAbstractFileByPath(sourcePath);
          if (!note || !(note instanceof TFile)) return fallback();
          const fileInfo = plugin.mediaNote.findMedia(note);
          if (!fileInfo) return fallback();
          return fallback(true);
        },
    }),
  );
}
