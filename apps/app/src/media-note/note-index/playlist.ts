/* eslint-disable @typescript-eslint/naming-convention */
import { Component, TFolder, TFile, parseLinktext, debounce } from "obsidian";
import type {
  MetadataCache,
  CachedMetadata,
  Pos,
  LinkCache,
  ListItemCache,
} from "obsidian";
import { getMediaInfoFor } from "@/media-view/media-info";
import type MxPlugin from "@/mx-main";
import type { MediaType } from "@/patch/media-type";
import { mediaInfoToURL, type MediaURL } from "@/web/url-match";
import {
  extractFirstMarkdownLink,
  extractListItemMainText,
  parseMarkdown,
} from "./syntax";

export interface Playlist {
  file: TFile;
  title: string;
  list: PlaylistItem[];
}
export interface PlaylistWithActive extends Playlist {
  active: number;
}
export interface PlaylistItem {
  media: MediaURL | null;
  title: string;
  type: MediaTaskSymbolType;
  /**
   * Index of the parent item in the list
   */
  parent: number;
}
export interface PlaylistItemWithMedia extends PlaylistItem {
  media: MediaURL;
}

export function isWithMedia(item: PlaylistItem): item is PlaylistItemWithMedia {
  return !!item.media;
}
export function findWithMedia(
  list: PlaylistItem[],
  predicate: (
    item: PlaylistItemWithMedia,
    i: number,
    arr: PlaylistItem[],
  ) => boolean,
  {
    fromIndex,
    reverse = false,
  }: { fromIndex?: number; reverse?: boolean } = {},
): PlaylistItemWithMedia | null {
  if (reverse) {
    for (let i = fromIndex ?? list.length - 1; i >= 0; i--) {
      const item = list[i];
      if (item && isWithMedia(item) && predicate(item, i, list)) return item;
    }
  } else {
    for (let i = fromIndex ?? 0; i < list.length; i++) {
      const item = list[i];
      if (item && isWithMedia(item) && predicate(item, i, list)) return item;
    }
  }
  return null;
}

const emptyLists: PlaylistWithActive[] = [];

declare module "obsidian" {
  interface MetadataCache {
    on(
      name: "mx-playlist-change",
      callback: (index: PlaylistIndex) => void,
    ): EventRef;
    trigger(name: "mx-playlist-change", index: PlaylistIndex): void;
  }
}

function extractText(text: string, range: Pos) {
  return text.slice(range.start.offset, range.end.offset);
}

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
  private listFileCache = new Map<string, Playlist>();

  private onResolve() {
    this.mediaToPlaylistIndex.clear();
    for (const { file, playlist } of iteratePlaylist(this.plugin)) {
      this.requestUpdate(file, playlist);
    }
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.requestUpdate(file, getPlaylistMeta(file, this.plugin));
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
      const next = prev.filter((playlist) => playlist !== prevPlaylist);
      if (next.length === 0) {
        this.mediaToPlaylistIndex.delete(media);
      } else {
        this.mediaToPlaylistIndex.set(media, next);
      }
    }
    this.requestNotify();
  }

  updateQueue = new WeakMap<TFile, Playlist>();
  updater = debounce((listFile: TFile) => {
    const data = this.updateQueue.get(listFile);
    if (!data) return;
    this.update(listFile, data);
    this.updateQueue.delete(listFile);
  }, 500);
  requestUpdate(listFile: TFile, data: Promise<Playlist | null>) {
    data.then((playlist) => {
      if (!playlist) return;
      this.updateQueue.set(listFile, playlist);
      this.updater(listFile);
    });
  }

  notify() {
    this.app.metadataCache.trigger("mx-playlist-change", this);
  }
  requestNotify = debounce(() => this.notify(), 500);

  update(listFile: TFile, data: Playlist) {
    this.remove(listFile.path);
    // make sure only one instance of the playlist is stored
    const uniqCache = new Set<string>();
    data.list.forEach((item) => {
      const { media } = item;
      if (!media) return;
      const key = media.jsonState.source;
      if (uniqCache.has(key)) return;
      this.mediaToPlaylistIndex.set(key, [
        ...(this.mediaToPlaylistIndex.get(key) ?? []),
        { ...data, active: data.list.findIndex((i) => media.compare(i.media)) },
      ]);
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

function waitUntilResolve(
  meta: MetadataCache,
  component?: Component,
): Promise<void> {
  if (meta.initialized) return Promise.resolve();
  return new Promise((resolve) => {
    const evt = meta.on("initialized", () => {
      meta.offref(evt);
      resolve();
    });
    component?.registerEvent(evt);
  });
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

function* iteratePlaylist(plugin: MxPlugin) {
  const { vault } = plugin.app;
  for (const file of iterateFiles(vault.getRoot())) {
    if (file.extension !== "md") continue;
    const playlist = getPlaylistMeta(file, plugin);
    if (!playlist) continue;
    yield { playlist, file };
  }
}

async function getPlaylistMeta(
  file: TFile,
  plugin: MxPlugin,
): Promise<Playlist | null> {
  const meta = plugin.app.metadataCache.getFileCache(file);
  if (!meta) return null;
  const ctx = { source: file, plugin };
  const list = await parsePlaylist(meta, ctx);
  if (!list) return null;
  return { title: getFileTitle(meta, file), list, file };
}

async function parsePlaylist(
  meta: CachedMetadata,
  ctx: {
    source: TFile;
    plugin: MxPlugin;
  },
): Promise<PlaylistItem[] | null> {
  const { metadataCache, vault } = ctx.plugin.app;
  const { frontmatter } = meta;
  if (frontmatter?.playlist !== true || !meta.sections || !meta.listItems)
    return null;

  const listSection = meta.sections.find((s) => s.type === "list");
  if (!listSection) return [];
  const withinListSection = (item: { position: Pos }) =>
    within(item, listSection);
  const listItems = meta.listItems.filter(withinListSection);
  if (!isPlaylistItems(listItems)) return [];

  const links = meta.links?.filter(withinListSection) ?? [];
  const fileContent = await vault.cachedRead(ctx.source);
  const playlist = listItems.map((listItem, i, arr): PlaylistItem => {
    const internalLinkIdx = links.findIndex((link) => within(link, listItem));
    const { parent: _parent, task } = listItem;
    const type = task && taskSymbolMediaTypeMap[task];

    // convert start_line-based indexing to array_index-based indexing
    const parent =
      _parent >= 0
        ? arr.findIndex((li) => li.position.start.line === _parent)
        : -1;
    if (internalLinkIdx !== -1) {
      // remove all links within the list item
      const internalLink = links[internalLinkIdx];
      const last = links.findLastIndex((link) => within(link, listItem));
      links.splice(internalLinkIdx, last - internalLinkIdx + 1);
      const media = mediaInfoFromInternalLink(internalLink);
      return {
        media,
        type: type ?? "generic",
        parent,
        title: internalLink.displayText ?? "",
      };
    }
    // handle external links
    const text = extractText(fileContent, listItem.position);
    const syntax = parseMarkdown(text);
    const externalLink = extractFirstMarkdownLink(text, syntax);
    if (externalLink) {
      const { display, url } = externalLink;
      const media = ctx.plugin.resolveUrl(url);
      return { media, title: display, type: type || "generic", parent };
    }
    return {
      media: null,
      title: extractListItemMainText(text, syntax) || "Item",
      type: type || "chapter",
      parent,
    };
  });
  return playlist;

  function mediaInfoFromInternalLink({ link }: LinkCache): MediaURL | null {
    const { path, subpath } = parseLinktext(link);
    const file = metadataCache.getFirstLinkpathDest(path, ctx.source.path);
    const mediaInfo = getMediaInfoFor(file, subpath);
    if (!mediaInfo) return null;
    return mediaInfoToURL(mediaInfo, vault);
  }
}

const taskSymbolMediaTypeMap = {
  ">": "video",
  "^": "audio",
  _: "subtitle",
  "#": "generic",
  "/": "chapter",
} satisfies Record<string, MediaType | "generic" | "subtitle" | "chapter">;
type MediaTaskSymbol = keyof typeof taskSymbolMediaTypeMap;
type MediaTaskSymbolType = (typeof taskSymbolMediaTypeMap)[MediaTaskSymbol];

function isPlaylistItems(
  list: ListItemCache[],
): list is (ListItemCache & { task?: MediaTaskSymbol })[] {
  return list.some(
    (i) => i.task && taskSymbolMediaTypeMap[i.task as MediaTaskSymbol],
  );
}

function getFileTitle(meta: CachedMetadata, file: TFile): string {
  return (
    meta.frontmatter?.title?.trim() ||
    meta.headings?.find((h) => h.level === 1)?.heading?.trim() ||
    file.basename.trim()
  );
}

function within(item: { position: Pos }, parent: { position: Pos }) {
  return (
    item.position.start.offset >= parent.position.start.offset &&
    item.position.end.offset <= parent.position.end.offset
  );
}
