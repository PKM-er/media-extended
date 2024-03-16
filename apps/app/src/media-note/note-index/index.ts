import { Component, TFolder, TFile, parseLinktext } from "obsidian";
import type { MetadataCache, Vault, CachedMetadata } from "obsidian";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/media-type";
import { mediaInfoToURL } from "@/web/url-match";
import type { MediaInfo } from "../../media-view/media-info";

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
    const notes = this.mediaToNoteIndex.get(this.mediaInfoToString(media));
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

  private mediaInfoToString(info: MediaInfo) {
    const url = mediaInfoToURL(info, this.app.vault);
    return `url:${url.jsonState.source}`;
  }

  removeMediaNote(toRemove: TFile) {
    const mediaInfo = this.noteToMediaIndex.get(toRemove.path)!;
    if (!mediaInfo) return;
    this.noteToMediaIndex.delete(toRemove.path);
    const mediaInfoKey = this.mediaInfoToString(mediaInfo);
    const mediaNotes = this.mediaToNoteIndex.get(mediaInfoKey);
    if (!mediaNotes) return;
    mediaNotes.delete(toRemove);
    if (mediaNotes.size === 0) {
      this.mediaToNoteIndex.delete(mediaInfoKey);
    }
  }
  addMediaNote(mediaInfo: MediaInfo, newNote: TFile) {
    this.noteToMediaIndex.set(newNote.path, mediaInfo);
    const key = this.mediaInfoToString(mediaInfo);
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

export const mediaSourceFieldMap = {
  generic: "media",
  video: "video",
  audio: "audio",
} as const;
type MediaType = (typeof mediaSourceFieldMap)[keyof typeof mediaSourceFieldMap];
export const mediaSourceFields = Object.values(
  mediaSourceFieldMap,
) as MediaType[];

export interface InternalLinkField {
  type: "internal";
  media: "video" | "audio";
  source: TFile;
  subpath: string;
  original: string;
}
export interface ExternalLinkField {
  type: "external";
  media: MediaType;
  source: URL;
  subpath: string;
  original: string;
  isSameSource: (src: string) => boolean;
}

function getMediaNoteMeta(
  file: TFile,
  { metadataCache, plugin }: { metadataCache: MetadataCache; plugin: MxPlugin },
): MediaInfo | null {
  const meta = metadataCache.getFileCache(file);
  if (!meta) return null;
  const ctx = { metadataCache, sourcePath: file.path, plugin };

  // prefer explicit typed media
  return (
    getField(mediaSourceFieldMap.video, meta, ctx) ??
    getField(mediaSourceFieldMap.audio, meta, ctx) ??
    getField(mediaSourceFieldMap.generic, meta, ctx)
  );
}

function getField(
  key: MediaType,
  meta: CachedMetadata,
  ctx: { metadataCache: MetadataCache; sourcePath: string; plugin: MxPlugin },
): MediaInfo | null {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter || !(key in frontmatter)) return null;
  const linkCache = frontmatterLinks?.find((link) => link.key === key);
  if (linkCache) {
    const { path: linkpath, subpath } = parseLinktext(linkCache.link);
    const mediaFile = ctx.metadataCache.getFirstLinkpathDest(
      linkpath,
      ctx.sourcePath,
    );
    if (!mediaFile) return null;
    // if local file, prefer detect media type
    const mediaType = checkMediaType(mediaFile.extension);
    if (!mediaType) return null;
    return {
      type: mediaType,
      file: mediaFile,
      hash: subpath,
    };
  }
  const content = frontmatter[key];
  if (typeof content !== "string") return null;
  return ctx.plugin.resolveUrl(content);
}
