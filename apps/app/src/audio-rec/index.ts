import { around } from "monkey-around";
import type { App, Editor, TAbstractFile } from "obsidian";
import { MarkdownView, Component, Notice, TFile } from "obsidian";

import { mediaInfoFromFile } from "@/info/media-info";
import {
  insertTimestamp,
  timestampGenerator,
} from "@/media-note/timestamp/utils";
import type MediaExtended from "../mx-main";

export class RecorderNote extends Component {
  constructor(public plugin: MediaExtended) {
    super();
  }

  onload(): void {
    if (!this.rec) {
      console.info("recorder not found, skip patching for recorder note");
    }
    this.patch();
    this.addCommand();
  }

  get app() {
    return this.plugin.app;
  }
  get rec() {
    return this.app.internalPlugins.plugins["audio-recorder"];
  }
  get settings() {
    return this.plugin.settings.getState();
  }

  _recording: { start: number; notified?: boolean; end?: number } | null = null;
  _recordedEditors = new Map<Editor, TFile | null>();

  onunload(): void {
    this._recordedEditors.clear();
  }

  async onRecordingSaved(file: TFile) {
    if (!this._recording) return;
    const { start } = this._recording;
    this._recording = null;

    const mediaInfo = mediaInfoFromFile(file, "");
    if (!mediaInfo) {
      new Notice("Failed to get media info from the saved file: " + file.path);
      return;
    }

    for (const entry of this._recordedEditors) {
      let editor: Editor | undefined = entry[0];
      let close: () => void = () => void 0;
      const noteFile = entry[1];
      if (!editor.containerEl.isConnected) {
        if (!noteFile) {
          new Notice(
            "One of the note with timestamp is closed, the timestamp will not be updated",
          );
          continue;
        }
        editor = findOpenedEditor(noteFile, this.app);
        if (!editor) {
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(noteFile, { state: { mode: "source" } });
          if (!(leaf.view instanceof MarkdownView)) {
            new Notice(
              "Failed to open note for timestamp update: " + noteFile.path,
            );
            continue;
          }
          editor = leaf.view.editor;
          close = () => leaf.detach();
        }
      }
      try {
        const content = editor
          .getValue()
          .replaceAll(genPlaceholderPattern(start), (_, offsetStr) => {
            const offsetMs = parseInt(offsetStr, 10);
            const genTimestamp = timestampGenerator(offsetMs / 1e3, mediaInfo, {
              app: this.app,
              settings: this.plugin.settings.getState(),
            });
            return genTimestamp(noteFile?.path ?? "");
          });
        editor.setValue(content);
      } catch (e) {
        console.error("failed to insert timestamp", e);
      } finally {
        close();
      }
    }
    this._recordedEditors.clear();
  }

  patch() {
    if (!this.rec.instance) return;
    const instance = this.rec.instance;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const { vault, workspace } = this.app;
    this.register(
      around(instance, {
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        saveRecording(next) {
          return function (this: any, ...args: any[]) {
            // prevent default behavior of opening new recording override and close the current editor
            workspace
              .getLeaf("split")
              .setViewState({ type: "empty", active: true });
            const returns = next.apply(this, args);
            const off = () => vault.off("create", handler);
            const timeout = window.setTimeout(off, 300e3); // wait for 5min
            const handler = (file: TAbstractFile) => {
              if (file instanceof TFile) {
                self.onRecordingSaved(file);
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
            self._recording = { start: Date.now() };
            console.debug("recording start called", self._recording.start);
            if (recorder && recorder instanceof MediaRecorder) {
              recorder.addEventListener(
                "start",
                () => {
                  self._recording = { start: Date.now() };
                  console.debug(
                    "recording started in MediaRecorder",
                    self._recording.start,
                  );
                },
                { once: true },
              );
              const recordStopTime = () => {
                if (self._recording) {
                  self._recording.end = Date.now();
                  console.debug(
                    "recording stopped in MediaRecorder",
                    self._recording.end,
                  );
                }
                recorder.removeEventListener("stop", recordStopTime);
                recorder.removeEventListener("error", recordStopTime);
              };
              recorder.addEventListener("stop", recordStopTime, { once: true });
              recorder.addEventListener("error", recordStopTime, {
                once: true,
              });
            }
            return re;
          };
        },
      }),
    );
  }

  addCommand() {
    this.plugin.addCommand({
      id: "take-rec-timestamp",
      name: "Take timestamp on current recording",
      editorCheckCallback: (checking, editor, view) => {
        if (!this._recording) return false;
        if (checking) return true;
        const { start, notified } = this._recording;
        if (!notified && !view.file) {
          new Notice(
            "You've taken a timestamp for the recording, probably in canvas node, " +
              "keep editor in foreground and in live preview mode. " +
              "Otherwise, the dummy timestamp cannot be updated when recording is saved.",
          );
          this._recording.notified = true;
        }
        const timestamp = stringifyPlaceholder(start, Date.now() - start);
        insertTimestamp(
          { timestamp },
          {
            editor,
            template: this.settings.timestampTemplate,
            insertBefore: this.settings.insertBefore,
          },
        );
        this._recordedEditors.set(editor, view.file);
      },
    });
  }
}

function genPlaceholderPattern(start: number) {
  return new RegExp(`%%REC_${start}_(?<offset>\\d+)%%`, "g");
}
function stringifyPlaceholder(start: number, offset: number) {
  return `%%REC_${start}_${offset}%%`;
}

declare module "obsidian" {
  interface App {
    internalPlugins: {
      plugins: Record<string, any>;
    };
  }
  interface Editor {
    containerEl: HTMLElement;
  }
}

function findOpenedEditor(file: TFile, app: App) {
  let view: MarkdownView | null = null as any;
  app.workspace.iterateAllLeaves((leaf) => {
    if (
      leaf.view instanceof MarkdownView &&
      file.path === leaf.view.file?.path &&
      leaf.view.getMode() === "source"
    ) {
      view = leaf.view;
    }
  });
  return view?.editor;
}
