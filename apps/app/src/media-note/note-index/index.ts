import { Component, TFolder, TFile, parseLinktext } from "obsidian";
import type { MetadataCache, App, Vault, CachedMetadata } from "obsidian";
import { toURL } from "@/lib/url";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/view-type";
import { checkMediaType } from "@/patch/media-type";
import { isFileMediaInfo, type FileMediaInfo } from "./file-info";
import { parseUrl, type UrlMediaInfo } from "./url-info";

export type MediaInfo = FileMediaInfo | UrlMediaInfo;

declare module "obsidian" {
  interface MetadataCache {
    on(name: "finished", callback: () => any, ctx?: any): EventRef;
    on(name: "initialized", callback: () => any, ctx?: any): EventRef;
    initialized: boolean;
  }
}

export class MediaNoteIndex extends Component {
  constructor(public app: App) {
    super();
  }

  private noteToMediaIndex = new Map<string, MediaInfo>();
  private mediaToNoteIndex = new Map<string, Set<TFile>>();

  findNotes(media: MediaInfo): TFile[] {
    const notes = this.mediaToNoteIndex.get(mediaInfoToString(media));
    if (!notes) return [];
    return [...notes];
  }
  findMedia(note: TFile) {
    return this.noteToMediaIndex.get(note.path);
  }

  private onResolve() {
    this.noteToMediaIndex.clear();
    this.mediaToNoteIndex.clear();
    for (const { file, mediaInfo } of iterateMediaNote(this.app)) {
      this.addMediaNote(mediaInfo, file);
    }
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const mediaInfo = getMediaNoteMeta(file, this.app);
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
    const mediaInfoKey = mediaInfoToString(mediaInfo);
    const mediaNotes = this.mediaToNoteIndex.get(mediaInfoKey);
    if (!mediaNotes) return;
    mediaNotes.delete(toRemove);
    if (mediaNotes.size === 0) {
      this.mediaToNoteIndex.delete(mediaInfoKey);
    }
  }
  addMediaNote(mediaInfo: MediaInfo, newNote: TFile) {
    this.noteToMediaIndex.set(newNote.path, mediaInfo);
    const mediaNotes = this.mediaToNoteIndex.get(mediaInfoToString(mediaInfo));
    if (!mediaNotes) {
      this.mediaToNoteIndex.set(
        mediaInfoToString(mediaInfo),
        new Set([newNote]),
      );
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
}) {
  for (const file of iterateFiles(ctx.vault.getRoot())) {
    if (file.extension !== "md") continue;
    const mediaInfo = getMediaNoteMeta(file, ctx);
    if (!mediaInfo) continue;
    yield { mediaInfo, file };
  }
}

export const mediaSourceField = {
  generic: "media",
  video: "video",
  audio: "audio",
} as const;
type MediaType = (typeof mediaSourceField)[keyof typeof mediaSourceField];

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
  { metadataCache }: { metadataCache: MetadataCache },
): MediaInfo | null {
  const meta = metadataCache.getFileCache(file);
  if (!meta) return null;
  const ctx = { metadataCache, sourcePath: file.path };

  // prefer explicit typed media
  return (
    getField(mediaSourceField.video, meta, ctx) ??
    getField(mediaSourceField.audio, meta, ctx) ??
    getField(mediaSourceField.generic, meta, ctx)
  );
}

function getField(
  key: MediaType,
  meta: CachedMetadata,
  ctx: { metadataCache: MetadataCache; sourcePath: string },
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
      viewType: MEDIA_FILE_VIEW_TYPE[mediaType],
      file: mediaFile,
      hash: subpath,
    };
  }
  const content = frontmatter[key];
  if (typeof content !== "string") return null;
  const url = toURL(content);
  if (!url) return null;
  const urlInfo = parseUrl(url.href);
  return urlInfo;
}

function mediaInfoToString(info: MediaInfo) {
  if (isFileMediaInfo(info)) {
    return `file:${info.file.path}`;
  } else {
    return `url:${info.cleanUrl}`;
  }
}
