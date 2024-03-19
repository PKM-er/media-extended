import { Component } from "obsidian";
import type { MetadataCache, Vault, TFile } from "obsidian";
import { iterateFiles } from "@/lib/iterate-files";
import { waitUntilResolve } from "@/lib/meta-resolve";
import type MxPlugin from "@/mx-main";
import { type MediaInfo } from "../../info/media-info";
import { toInfoKey } from "./def";
import { getMediaNoteMeta } from "./extract";

declare module "obsidian" {
  interface MetadataCache {
    on(name: "finished", callback: () => any, ctx?: any): EventRef;
    on(name: "initialized", callback: () => any, ctx?: any): EventRef;
    initialized: boolean;
  }
}

export class MediaNoteIndex extends Component {
  app;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }

  private noteToMediaIndex = new Map<string, MediaInfo>();
  private mediaToNoteIndex = new Map<string, Set<TFile>>();

  findNotes(media: MediaInfo): TFile[] {
    const notes = this.mediaToNoteIndex.get(toInfoKey(media));
    if (!notes) return [];
    return [...notes];
  }
  findMedia(note: TFile) {
    return this.noteToMediaIndex.get(note.path);
  }

  private onResolve() {
    this.noteToMediaIndex.clear();
    this.mediaToNoteIndex.clear();
    const ctx = {
      metadataCache: this.app.metadataCache,
      vault: this.app.vault,
      plugin: this.plugin,
    };
    for (const { file, mediaInfo } of iterateMediaNote(ctx)) {
      this.addMediaNote(mediaInfo, file);
    }
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const mediaInfo = getMediaNoteMeta(file, ctx);
        if (!mediaInfo) return;
        this.addMediaNote(mediaInfo, file);
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("deleted", (file) => {
        this.removeMediaNote(file);
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!this.noteToMediaIndex.has(oldPath)) return;
        const mediaInfo = this.noteToMediaIndex.get(oldPath)!;
        this.noteToMediaIndex.delete(oldPath);
        this.noteToMediaIndex.set(file.path, mediaInfo);
        // mediaToNoteIndex don't need to update
        // since TFile pointer is not changed
      }),
    );
  }

  removeMediaNote(toRemove: TFile) {
    const mediaInfo = this.noteToMediaIndex.get(toRemove.path)!;
    if (!mediaInfo) return;
    this.noteToMediaIndex.delete(toRemove.path);
    const mediaInfoKey = toInfoKey(mediaInfo);
    const mediaNotes = this.mediaToNoteIndex.get(mediaInfoKey);
    if (!mediaNotes) return;
    mediaNotes.delete(toRemove);
    if (mediaNotes.size === 0) {
      this.mediaToNoteIndex.delete(mediaInfoKey);
    }
  }
  addMediaNote(mediaInfo: MediaInfo, newNote: TFile) {
    this.noteToMediaIndex.set(newNote.path, mediaInfo);
    const key = toInfoKey(mediaInfo);
    const mediaNotes = this.mediaToNoteIndex.get(key);
    if (!mediaNotes) {
      this.mediaToNoteIndex.set(key, new Set([newNote]));
    } else {
      mediaNotes.add(newNote);
    }
  }

  onload(): void {
    waitUntilResolve(this.app.metadataCache, this).then(() => {
      this.onResolve();
    });
  }
}

function* iterateMediaNote(ctx: {
  metadataCache: MetadataCache;
  vault: Vault;
  plugin: MxPlugin;
}) {
  for (const file of iterateFiles(ctx.vault.getRoot())) {
    if (file.extension !== "md") continue;
    const mediaInfo = getMediaNoteMeta(file, ctx);
    if (!mediaInfo) continue;
    yield { mediaInfo, file };
  }
}
