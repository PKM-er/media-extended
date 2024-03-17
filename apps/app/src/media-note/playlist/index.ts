/* eslint-disable @typescript-eslint/naming-convention */
import { Component, TFolder, TFile, debounce } from "obsidian";
import { waitUntilResolve } from "@/lib/meta-resolve";
import type MxPlugin from "@/mx-main";
import { type MediaURL } from "@/web/url-match";
import { emptyLists } from "./def";
import type { PlaylistWithActive, Playlist } from "./def";
import { getPlaylistMeta } from "./extract";

export class PlaylistIndex extends Component {
  app;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }

  get(media: MediaURL | undefined) {
    if (!media) return emptyLists;
    return this.mediaToPlaylistIndex.get(media.jsonState.source) ?? emptyLists;
  }

  /**
   * immutable update playlist array holding the media
   * to make reactivity work
   */
  private mediaToPlaylistIndex = new Map<string, PlaylistWithActive[]>();
  private listVariantMap = new WeakMap<PlaylistWithActive, Playlist>();
  private listFileCache = new Map<string, Playlist>();

  private onResolve() {
    this.mediaToPlaylistIndex.clear();
    for (const file of iterateFiles(this.app.vault.getRoot())) {
      if (file.extension !== "md") continue;
      this.requestUpdate(file);
    }
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.requestUpdate(file);
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("deleted", (file) => {
        this.remove(file.path);
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFile)) return;
        const prev = this.listFileCache.get(oldPath);
        if (!prev) return;
        this.remove(oldPath);
        this.update(file, prev);
      }),
    );
  }

  remove(listFilePath: string) {
    const prevPlaylist = this.listFileCache.get(listFilePath);
    if (!prevPlaylist) return;
    this.listFileCache.delete(listFilePath);
    // clear old data
    for (const media of this.mediaToPlaylistIndex.keys()) {
      const prev = this.mediaToPlaylistIndex.get(media)!;
      const next = prev.filter(
        (playlist) =>
          !this.listVariantMap.has(playlist) ||
          this.listVariantMap.get(playlist)! !== prevPlaylist,
      );
      if (next.length === 0) {
        this.mediaToPlaylistIndex.delete(media);
      } else {
        this.mediaToPlaylistIndex.set(media, next);
      }
    }
    this.requestNotify();
  }

  updateQueue = new Set<TFile>();
  updater = debounce(async () => {
    const files = [...this.updateQueue.values()];
    this.updateQueue.clear();
    if (files.length === 0) return;
    await Promise.all(
      files.map((f) =>
        getPlaylistMeta(f, this.plugin).then((l) => {
          if (l) {
            this.update(f, l);
          } else {
            this.remove(f.path);
          }
        }),
      ),
    );
    if (this.updateQueue.size > 0) {
      this.updater();
    }
  }, 500);
  requestUpdate(file: TFile) {
    this.updateQueue.add(file);
    this.updater();
  }

  notify() {
    this.app.metadataCache.trigger("mx-playlist-change");
  }
  requestNotify = debounce(() => this.notify(), 500);

  update(listFile: TFile, data: Playlist) {
    this.remove(listFile.path);
    this.listFileCache.set(listFile.path, data);
    // make sure only one instance of the playlist is stored
    const uniqCache = new Set<string>();
    data.list.forEach((item) => {
      const { media } = item;
      if (!media) return;
      const key = media.jsonState.source;
      if (uniqCache.has(key)) return;
      const others = this.mediaToPlaylistIndex.get(key) ?? [];
      const curr = {
        ...data,
        active: data.list.findIndex((i) => media.compare(i.media)),
      };
      this.listVariantMap.set(curr, data);
      this.mediaToPlaylistIndex.set(key, [...others, curr]);
      uniqCache.add(key);
    });
    this.requestNotify();
  }

  onload(): void {
    waitUntilResolve(this.app.metadataCache, this).then(() => {
      this.onResolve();
    });
  }
}

function* iterateFiles(folder: TFolder): IterableIterator<TFile> {
  for (const child of folder.children) {
    if (child instanceof TFolder) {
      yield* iterateFiles(child);
    } else if (child instanceof TFile) {
      yield child;
    }
  }
}
