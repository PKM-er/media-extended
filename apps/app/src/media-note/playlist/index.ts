/* eslint-disable @typescript-eslint/naming-convention */
import { Component, TFile, debounce } from "obsidian";
import type { MediaInfo } from "@/info/media-info";
import { getMediaInfoID } from "@/info/media-info";
import { waitUntilResolve } from "@/lib/meta-resolve";
import type MxPlugin from "@/mx-main";
import { iterateFiles } from "../../lib/iterate-files";
import { emptyLists } from "./def";
import type { PlaylistWithActive, Playlist } from "./def";
import { generateM3U8File } from "./export";
import { getPlaylistMeta } from "./extract";

export class PlaylistIndex extends Component {
  app;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }

  get(media: MediaInfo | undefined) {
    if (!media) return emptyLists;
    return this.mediaToPlaylistIndex.get(getMediaInfoID(media)) ?? emptyLists;
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
    this.app.metadataCache.trigger("mx:playlist-change");
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
      const key = getMediaInfoID(media);
      if (uniqCache.has(key)) return;
      const others = this.mediaToPlaylistIndex.get(key) ?? [];
      const curr = {
        ...data,
        active: data.list.findIndex(
          (i) => i.media && key === getMediaInfoID(i.media),
        ),
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
    this.plugin.addCommand({
      id: "playlist-export",
      name: "Export current playlist to m3u8 file",
      editorCheckCallback: (checking, editor, ctx) => {
        if (!ctx.file || !this.listFileCache.has(ctx.file.path)) return false;
        if (checking) return true;
        generateM3U8File(
          this.listFileCache.get(ctx.file.path)!,
          this.app.vault,
        );
      },
    });
    this.registerEvent(
      this.app.workspace.on(
        "file-menu",
        (menu, file, source) =>
          source === "more-options" &&
          this.listFileCache.has(file.path) &&
          menu.addItem((item) =>
            item
              .setTitle("Export to m3u8...")
              .setIcon("file-down")
              .setSection("action")
              .onClick(() => {
                generateM3U8File(
                  this.listFileCache.get(file.path)!,
                  this.app.vault,
                );
              }),
          ),
      ),
    );
  }
}
