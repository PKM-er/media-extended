import type { TFile } from "obsidian";
import { Component } from "obsidian";
import { getTrackInfoID, isVaultTrack } from "@/info/track-info";
import type { TextTrackInfo } from "@/info/track-info";
import { createEventEmitter } from "@/lib/emitter";
import type MxPlugin from "@/mx-main";
import { isUnresolvedTrackLink, resolveTrackLink } from "./meta";
import type { MetaTextTrackInfo, UnresolvedTrackLink } from "./meta";

declare module "obsidian" {
  interface MetadataCache {
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
  }
}
export class TranscriptIndex extends Component {
  app;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }

  private noteToTrack = new Map<string, MetaTextTrackInfo[]>();

  #event = createEventEmitter<{
    changed: (updated: Set<string>, note: TFile) => void;
  }>();
  on(event: "changed", cb: (updated: Set<string>, note: TFile) => void) {
    return this.#event.on("changed", cb);
  }

  private trackIDToNote = new Map<string, Set<TFile>>();

  onload(): void {
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!this.noteToTrack.has(oldPath)) return;
        const tracks = this.noteToTrack.get(oldPath);
        if (tracks) {
          this.noteToTrack.delete(oldPath);
          this.noteToTrack.set(file.path, tracks);
        }
        // media(track)ToNoteIndex don't need to update
        // since TFile pointer is not changed
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("resolve", this.onResolve, this),
    );
  }

  #resolveLink(note: TFile, track: UnresolvedTrackLink) {
    const resolved = resolveTrackLink(track, note.path, this.app);
    if (!resolved) return null;
    const id = getTrackInfoID(resolved).id;
    const notes = this.trackIDToNote.get(id) ?? new Set();
    notes.add(note);
    this.trackIDToNote.set(id, notes);
    return id;
  }

  onResolve(note: TFile) {
    const tracks = this.noteToTrack.get(note.path);
    if (!tracks) return;
    const removed = new Set<string>();
    this.trackIDToNote.forEach((notes, trackID, map) => {
      if (!notes.has(note) || !isVaultTrack(trackID)) return;
      removed.add(trackID);
      notes.delete(note);
      if (notes.size > 0) {
        map.set(trackID, notes);
      } else {
        map.delete(trackID);
      }
    });
    const added = tracks
      .filter(isUnresolvedTrackLink)
      .map((track) => this.#resolveLink(note, track))
      .filter((id): id is string => !!id);

    const unchanged = new Set(added.filter((x) => removed.has(x)));
    const updated = new Set(
      [...added, ...removed].filter((x) => !unchanged.has(x)),
    );
    if (updated.size > 0) this.#event.emit("changed", updated, note);
  }

  add(note: TFile, tracks: MetaTextTrackInfo[]) {
    const removed = this.#remove(note);
    this.noteToTrack.set(note.path, tracks);
    const added = new Set<string>();
    tracks.forEach((track) => {
      let trackID: string | null;
      if (isUnresolvedTrackLink(track)) {
        trackID = this.#resolveLink(note, track);
      } else {
        trackID = getTrackInfoID(track).id;
        const notes = this.trackIDToNote.get(trackID) ?? new Set();
        notes.add(note);
        this.trackIDToNote.set(getTrackInfoID(track).id, notes);
      }
      if (trackID) added.add(trackID);
    });
    const unchanged = new Set(removed.filter((x) => added.has(x)));
    const updated = new Set(
      [...added, ...removed].filter((x) => !unchanged.has(x)),
    );
    if (updated.size > 0) this.#event.emit("changed", updated, note);
  }

  /**
   * @returns affected track's ids
   */
  #remove(note: TFile) {
    this.noteToTrack.delete(note.path);
    const affected: string[] = [];
    this.trackIDToNote.forEach((notes, trackID, map) => {
      if (!notes.has(note)) return;
      affected.push(trackID);
      notes.delete(note);
      if (notes.size > 0) {
        map.set(trackID, notes);
      } else {
        map.delete(trackID);
      }
    });
    return affected;
  }

  remove(note: TFile) {
    const updated = new Set(this.#remove(note));
    if (updated.size > 0) this.#event.emit("changed", updated, note);
  }

  clear() {
    this.noteToTrack.clear();
    this.trackIDToNote.clear();
  }

  getLinkedTextTracks(note: TFile): TextTrackInfo[] {
    const tracks = this.noteToTrack.get(note.path);
    if (!tracks) return [];
    return tracks
      .map((t) =>
        isUnresolvedTrackLink(t) ? resolveTrackLink(t, note.path, this.app) : t,
      )
      .filter((t): t is TextTrackInfo => !!t);
  }
  getLinkedMediaNotes(track: TextTrackInfo): TFile[] {
    const trackID = getTrackInfoID(track).id;
    const notes = this.trackIDToNote.get(trackID);
    if (!notes) return [];
    return [...notes];
  }
}
