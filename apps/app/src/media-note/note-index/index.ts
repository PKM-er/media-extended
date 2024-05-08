import type { MediaPlayerInstance } from "@vidstack/react";
import { Component, debounce } from "obsidian";
import type { MetadataCache, Vault, TFile } from "obsidian";
import { getMediaInfoID, isFileMediaInfo } from "@/info/media-info";
import { type MediaInfo } from "@/info/media-info";
import { checkMediaType } from "@/info/media-type";
import { getTrackInfoID, type TextTrackInfo } from "@/info/track-info";
import { iterateFiles } from "@/lib/iterate-files";
import { waitUntilResolve } from "@/lib/meta-resolve";
import { normalizeFilename } from "@/lib/norm";
import type { PlayerComponent } from "@/media-view/base";
import type MxPlugin from "@/mx-main";
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
    on(
      name: "mx:transcript-changed",
      callback: (trackIDs: Set<string>, mediaID: string) => any,
      ctx?: any,
    ): EventRef;
    trigger(
      name: "mx:transcript-changed",
      trackIDs: Set<string>,
      mediaID: string,
    ): void;
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
  private mediaToNoteIndex = new Map<string, TFile>();

  private mediaToTrackIndex = new Map<string, TextTrackInfo[]>();
  private trackToMediaIndex = new Map<string, MediaInfo[]>();

  getLinkedTextTracks(media: MediaInfo) {
    return this.mediaToTrackIndex.get(getMediaInfoID(media)) ?? [];
  }
  getLinkedMedia(track: TextTrackInfo) {
    return this.trackToMediaIndex.get(getTrackInfoID(track).id) ?? [];
  }

  findNote(media: MediaInfo): TFile | null {
    return this.mediaToNoteIndex.get(getMediaInfoID(media)) ?? null;
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
        // mediaToNoteIndex don't need to update
        // since TFile pointer is not changed
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

  private resetTracks(mediaID: string): string[] {
    const tracks = this.mediaToTrackIndex.get(mediaID);
    if (!tracks) return [];
    const affected = tracks.map((track) => getTrackInfoID(track).id);
    this.mediaToTrackIndex.delete(mediaID);
    tracks.forEach((track) => {
      const trackID = getTrackInfoID(track).id;
      const linkedMedia = this.trackToMediaIndex.get(trackID);
      if (!linkedMedia) return;
      const filteredMedia = linkedMedia.filter(
        (media) => getMediaInfoID(media) !== mediaID,
      );
      if (filteredMedia.length > 0) {
        this.trackToMediaIndex.set(trackID, filteredMedia);
      } else {
        this.trackToMediaIndex.delete(trackID);
      }
    });
    return affected;
  }

  removeMediaNote(toRemove: TFile) {
    const mediaInfo = this.noteToMediaIndex.get(toRemove.path)!;
    if (!mediaInfo) return;
    this.noteToMediaIndex.delete(toRemove.path);
    const mediaID = getMediaInfoID(mediaInfo);
    this.mediaToNoteIndex.delete(mediaID);
    const affected = this.resetTracks(mediaID);
    if (affected.length > 0) {
      this.app.metadataCache.trigger(
        "mx:transcript-changed",
        new Set(affected),
        mediaID,
      );
    }
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
    const affected = new Set(this.resetTracks(mediaID));
    const { textTracks } = meta.data;
    if (textTracks.length > 0) {
      this.mediaToTrackIndex.set(mediaID, textTracks);
      textTracks.forEach((track) => {
        const trackID = getTrackInfoID(track).id;
        affected.add(trackID);
        const linkedMedia = [
          meta.src,
          ...(this.trackToMediaIndex.get(trackID) ?? []),
        ];
        this.trackToMediaIndex.set(trackID, linkedMedia);
      });
    }
    if (affected.size > 0) {
      this.app.metadataCache.trigger(
        "mx:transcript-changed",
        affected,
        mediaID,
      );
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
