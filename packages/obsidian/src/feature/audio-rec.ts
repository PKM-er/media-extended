import { insertToCursor } from "@misc/obsidian";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import { secondToFragFormat } from "mx-base";
import { MarkdownView, TAbstractFile, TFile } from "obsidian";

export function setupRec(this: MediaExtended) {
  const { vault, fileManager, workspace } = this.app;
  const plugin = this;
  const rec = this.app.internalPlugins.plugins["audio-recorder"];
  if (!rec) return;

  const replace = (recFile: TFile) => {
    const startTime = plugin.recStartTime;
    plugin.recStartTime = null;
    const modify = async (mdFile: TFile) => {
      const content = await vault.read(mdFile);
      return vault.modify(
        mdFile,
        content.replace(
          new RegExp(`%%REC_${startTime}#t=([\\d.]+?)%%`, "g"),
          (_s, sec) => {
            const display = secondToFragFormat(+sec);
            const link = fileManager
              .generateMarkdownLink(recFile, mdFile.path, "#t=" + sec, display)
              .substring(1);
            if (link.startsWith("[]"))
              return link.replace(/^\[\]/, `[${display}]`);
            else return link;
          },
        ),
      );
    };
    workspace.getLeavesOfType("markdown").forEach((leaf) => {
      if (!(leaf.view instanceof MarkdownView)) return;

      if (leaf !== workspace.activeLeaf) modify(leaf.view.file);
      else {
        // try to modify after audio-recorder inserted file link
        window.setTimeout(() => {
          if (leaf.view instanceof MarkdownView) modify(leaf.view.file);
        }, 500);
      }
    });
  };

  this.addCommand({
    id: "take-rec-timestamp",
    name: "Get Current Timestamp of Recording",
    editorCheckCallback: (checking, _editor, view) => {
      if (checking) {
        return typeof this.recStartTime === "number";
      } else {
        const start = this.recStartTime;
        if (start) {
          const { timestampTemplate: template } = this.settings;
          const timestamp = `%%REC_${this.recStartTime}#t=${
            (Date.now() - start) / 1e3
          }%%`;
          insertToCursor(template.replace(/{{TIMESTAMP}}/g, timestamp), view);
        }
      }
    },
  });

  const unload = around(rec.instance, {
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    saveRecording(next) {
      return function (this: any, ...args: any[]) {
        const returns = next.apply(this, args);
        const off = () => vault.off("create", handler);
        const timeout = window.setTimeout(off, 300e3); // wait for 5min
        const handler = (file: TAbstractFile) => {
          if (file instanceof TFile) {
            replace(file);
          } else {
            console.error("unexpected folder");
          }
          off();
          window.clearTimeout(timeout);
        };
        vault.on("create", handler);
        return returns;
      };
    },

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    startRecording(next) {
      return function (this: any, ...args: any[]) {
        const re = next.apply(this, args);
        const recorder: MediaRecorder | undefined = this.recorder;
        plugin.recStartTime = Date.now();
        if (recorder && recorder instanceof MediaRecorder) {
          recorder.addEventListener("start", () => {
            // const now = Date.now();
            // console.log(now - (plugin.startTime ?? 0));
            plugin.recStartTime = Date.now();
          });
        }

        return re;
      };
    },
  });
  this.register(unload);
}
