import type { MediaPlayerInstance } from "@vidstack/react";
import type { MetadataCache, Vault, TFile } from "obsidian";
import { Component, debounce } from "obsidian";
import { getMediaInfoID, isFileMediaInfo } from "@/info/media-info";
import { type MediaInfo } from "@/info/media-info";
import { checkMediaType } from "@/info/media-type";
import type { TextTrackInfo } from "@/info/track-info";
import { iterateFiles } from "@/lib/iterate-files";
import { waitUntilResolve as waitUntilMetaInited } from "@/lib/meta-resolve";
import { normalizeFilename } from "@/lib/norm";
import type { PlayerComponent } from "@/media-view/base";
import type MxPlugin from "@/mx-main";
import { TranscriptIndex } from "../../transcript/handle/indexer";
import { mediaTitle } from "../title";
import type { MediaSourceFieldType } from "./def";
import type { ParsedMediaNoteMetadata } from "./extract";
import { getMediaNoteMeta } from "./extract";

export interface NewNoteInfo {
  title: string;
  fm: (newNotePath: string) => Record<string, any>;
  sourcePath?: string;
}

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
    this.transcript = this.addChild(new TranscriptIndex(this.plugin));
  }

  // media - note map is one-to-one
  private noteToMediaIndex = new Map<string, MediaInfo>();
  private mediaToNoteIndex = new Map<string, TFile>();

  private transcript;

  getLinkedTextTracks(media: MediaInfo) {
    const note = this.findNote(media);
    if (!note) return [];
    return this.transcript.getLinkedTextTracks(note);
  }
  getLinkedMedia(track: TextTrackInfo): MediaInfo[] {
    const notes = this.transcript.getLinkedMediaNotes(track);
    return notes.map((note) => this.findMedia(note)!);
  }

  findNote(media: MediaInfo): TFile | null {
    return this.mediaToNoteIndex.get(getMediaInfoID(media)) ?? null;
  }
  findMedia(note: TFile) {
    return this.noteToMediaIndex.get(note.path);
  }

  private onResolved() {
    this.noteToMediaIndex.clear();
    this.mediaToNoteIndex.clear();
    this.transcript.clear();
    const ctx = {
      metadataCache: this.app.metadataCache,
      vault: this.app.vault,
      plugin: this.plugin,
    };
    for (const { file, meta } of iterateMediaNote(ctx)) {
      this.addMediaNote(meta, file);
    }
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const meta = getMediaNoteMeta(file, ctx);
        if (!meta) return;
        this.addMediaNote(meta, file);
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
        // media(track)ToNoteIndex don't need to update
        // since TFile pointer is not changed
      }),
    );
    this.register(
      this.transcript.on("changed", (updated, note) => {
        const mediaInfo = this.findMedia(note);
        if (!mediaInfo) {
          console.warn(
            "Media not found for note while responding to transcript change",
            note.path,
          );
          return;
        }
        this.plugin.app.metadataCache.trigger(
          "mx:transcript-changed",
          updated,
          getMediaInfoID(mediaInfo),
        );
      }),
    );
  }

  /**
   * create if not exists
   */
  async #getNote(
    mediaInfo: MediaInfo,
    newNoteInfo: NewNoteInfo,
  ): Promise<TFile> {
    const note = this.plugin.mediaNote.findNote(mediaInfo);
    if (note) return note;
    const title = normalizeFilename(newNoteInfo.title);
    const filename = `Media Note - ${title}`;
    return await this.#createNewNote(
      filename,
      newNoteInfo.fm,
      newNoteInfo.sourcePath ?? "",
    );
  }
  /**
   * open media note, create if not exist
   */
  getNote(
    mediaInfo: MediaInfo,
    player: MediaPlayerInstance | null,
  ): Promise<TFile> {
    const { metadataCache } = this.app;
    if (!player) {
      throw new Error("Player not initialized");
    }
    const title = mediaTitle(mediaInfo, { state: player.state });
    if (isFileMediaInfo(mediaInfo)) {
      const mediaType = checkMediaType(mediaInfo.file.extension)!;
      const file = mediaInfo.file;
      return this.#getNote(mediaInfo, {
        title,
        fm: (newNotePath) => ({
          [mediaType]: `[[${metadataCache.fileToLinktext(file, newNotePath)}]]`,
        }),
        sourcePath: file.path,
      });
    } else {
      const type: MediaSourceFieldType = mediaInfo.inferredType ?? "media";
      return this.#getNote(mediaInfo, {
        title,
        fm: () => ({ [type]: mediaInfo.jsonState.source }),
      });
    }
  }
  async #createNewNote(
    filename: string,
    fm: (sourcePath: string) => Record<string, any>,
    sourcePath = "",
  ) {
    const { fileManager } = this.app;
    const folder = fileManager.getNewFileParent(sourcePath, filename);
    const newNote = await fileManager.createNewFile(
      folder,
      filename,
      "md",
      "---\n---\n",
    );
    await fileManager.processFrontMatter(newNote, (fn) => {
      Object.assign(fn, fm(newNote.path));
    });
    return newNote;
  }

  removeMediaNote(note: TFile) {
    const mediaInfo = this.noteToMediaIndex.get(note.path)!;
    if (!mediaInfo) return;
    this.noteToMediaIndex.delete(note.path);
    const mediaID = getMediaInfoID(mediaInfo);
    this.mediaToNoteIndex.delete(mediaID);
    this.transcript.remove(note);
  }
  addMediaNote(meta: ParsedMediaNoteMetadata, newNote: TFile) {
    const mediaID = getMediaInfoID(meta.src);
    const prevNote = this.mediaToNoteIndex.get(mediaID);
    // skip if note to add is created after existing note
    if (
      prevNote &&
      prevNote !== newNote &&
      prevNote.stat.ctime <= newNote.stat.ctime
    )
      return;
    this.noteToMediaIndex.set(newNote.path, meta.src);
    this.mediaToNoteIndex.set(mediaID, newNote);
    this.transcript.add(newNote, meta.data.textTracks);
  }

  onload(): void {
    waitUntilMetaInited(this.app.metadataCache, this).then(() => {
      this.onResolved();
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
    const meta = getMediaNoteMeta(file, ctx);
    if (!meta) continue;
    yield { meta, file };
  }
}

export function handleTrackUpdate(this: PlayerComponent) {
  const updateTracks = asyncDebounce(async (url: MediaInfo) => {
    const textTracks = await this.plugin.transcript.getTracks(url);
    this.store.getState().setTextTracks(textTracks);
  });
  this.registerEvent(
    this.plugin.app.metadataCache.on(
      "mx:transcript-changed",
      async (_, mediaID) => {
        const currMedia = this.getMediaInfo();
        if (!currMedia) return;
        const currMediaID = getMediaInfoID(currMedia);
        if (currMediaID !== mediaID) return;
        await updateTracks(currMedia);
      },
    ),
  );
}

function asyncDebounce<F extends (...args: any[]) => Promise<any>>(
  func: F,
  wait?: number,
) {
  const resolveSet = new Set<(p: any) => void>();
  const rejectSet = new Set<(p: any) => void>();

  const debounced = debounce((args: Parameters<F>) => {
    func(...args)
      .then((...res) => {
        resolveSet.forEach((resolve) => resolve(...res));
        resolveSet.clear();
      })
      .catch((...res) => {
        rejectSet.forEach((reject) => reject(...res));
        rejectSet.clear();
      });
  }, wait);

  return (...args: Parameters<F>): ReturnType<F> =>
    new Promise((resolve, reject) => {
      resolveSet.add(resolve);
      rejectSet.add(reject);
      debounced(args);
    }) as ReturnType<F>;
}
