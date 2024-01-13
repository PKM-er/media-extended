import { Notice, TFile, parseLinktext, TFolder } from "obsidian";
import type {
  CachedMetadata,
  TAbstractFile,
  App,
  MarkdownView,
  Editor,
} from "obsidian";
import { openInLeaf, parseUrl } from "@/lib/link-click/external";
import { openInOpenedPlayer } from "@/lib/link-click/opened";
import { toURL } from "@/lib/url";
import { checkMediaType } from "@/patch/utils";

export const mediaSourceField = {
  generic: "media",
  video: "video",
  audio: "audio",
} as const;

type MediaType = (typeof mediaSourceField)[keyof typeof mediaSourceField];

export interface InternalLinkField {
  type: "internal";
  media: MediaType;
  source: string;
  original: string;
}
export interface ExternalLinkField {
  type: "external";
  media: MediaType;
  source: URL;
}

export function noteUtils({
  metadataCache,
  workspace,
  vault,
  fileManager,
}: App) {
  const mediaNoteFinder = {
    local: (source: TFile) => {
      return Array.from(iterateMatchedMediaNote());

      function* iterateMatchedMediaNote() {
        for (const { mediaInfo, file } of iterateMediaNote()) {
          if (mediaInfo.type !== "internal") continue;
          const linkinfo = resolveLink(mediaInfo.source, file);
          if (!linkinfo || linkinfo.file.path !== source.path) continue;
          yield file;
        }
      }
    },
    url: (source: string) => {
      return Array.from(iterateMatchedMediaNote());
      function* iterateMatchedMediaNote() {
        const myUrlInfo = parseUrl(source);
        if (!myUrlInfo) return;
        for (const { mediaInfo, file } of iterateMediaNote()) {
          if (
            mediaInfo.type !== "external" ||
            !myUrlInfo.isSameSource(mediaInfo.source.href)
          )
            continue;
          yield file;
        }
      }
    },
  };

  return {
    mediaNoteFinder,
    getMediaInfo,
    resolveLink,
    openMedia,
    openMarkdownView,
  };

  async function openMarkdownView(
    notes: TFile[],
    newNoteTitle: string,
    toNewNoteFm: (sourcePath: string) => Record<string, any>,
    sourcePath: string,
  ): Promise<{ file: TFile; editor: Editor }> {
    if (notes.length > 0) {
      const view = getOpenedView(notes);
      if (view) return { file: view.file!, editor: view.editor };
      const leaf = workspace.getLeaf("split", "vertical");
      const targetNote = notes[0];
      await leaf.openFile(targetNote);
      return {
        file: targetNote,
        editor: (leaf.view as MarkdownView).editor,
      };
    }
    const filename = `Media Note - ${newNoteTitle}.md`;
    const view = await createNewNoteAndOpen(filename, toNewNoteFm, sourcePath);
    return { file: view.file!, editor: view.editor };
  }

  function getMediaInfo(
    file: TAbstractFile,
  ): ExternalLinkField | InternalLinkField | null {
    if (!(file instanceof TFile)) return null;
    const meta = metadataCache.getFileCache(file);
    if (!meta) return null;

    // prefer explicit typed media
    return (
      getField(mediaSourceField.video, meta) ??
      getField(mediaSourceField.audio, meta) ??
      getField(mediaSourceField.generic, meta)
    );
  }

  function resolveLink(linktext: string, file: TFile) {
    const { path: linkpath, subpath } = parseLinktext(linktext);
    const mediaFile = metadataCache.getFirstLinkpathDest(linkpath, file.path);
    if (!mediaFile) return null;
    // if local file, prefer detect media type
    const mediaType = checkMediaType(mediaFile.extension);
    if (!mediaType) return null;
    return { file: mediaFile, subpath };
  }

  async function openMedia(
    mediaInfo: InternalLinkField | ExternalLinkField,
    file: TFile,
  ) {
    const leaf = workspace.getLeaf("split", "vertical");
    if (mediaInfo.type === "internal") {
      const linkFile = resolveLink(mediaInfo.source, file as TFile);
      if (!linkFile) {
        new Notice(`Cannot resolve media file from link ${mediaInfo.original}`);
        return;
      }
      await leaf.openFile(linkFile.file, {
        eState: { subpath: linkFile.subpath },
      });
    } else {
      const urlInfo = parseUrl(mediaInfo.source.href);
      if (!urlInfo) {
        new Notice(
          `Failed to open media url ${mediaInfo.source.href}, invalid url or not supported`,
        );
        return;
      }
      if (openInOpenedPlayer(urlInfo, workspace)) return;
      await openInLeaf(urlInfo, leaf);
    }
  }
  function* iterateMediaNote() {
    for (const file of iterateFiles(vault.getRoot())) {
      if (file.extension !== "md") continue;
      const mediaInfo = getMediaInfo(file);
      if (!mediaInfo) continue;
      yield { mediaInfo, file };
    }
  }
  function getOpenedView(notes: TFile[]) {
    const openedViews = workspace
      .getLeavesOfType("markdown")
      .filter((leaf) => {
        const filePath = (leaf.view as MarkdownView).file?.path;
        return !!filePath && notes.some((note) => note.path === filePath);
      })
      .map((v) => v.view as MarkdownView);
    return openedViews.at(0) ?? null;
  }

  async function createNewNoteAndOpen(
    filename: string,
    fm: (sourcePath: string) => Record<string, any>,
    sourcePath = "",
  ) {
    const folder = fileManager.getNewFileParent(sourcePath, filename);
    const newNote = await vault.create(`${folder.path}/${filename}`, "");
    await fileManager.processFrontMatter(newNote, (fn) => {
      Object.assign(fn, fm(newNote.path));
    });
    const leaf = workspace.getLeaf("split", "vertical");
    await leaf.openFile(newNote);
    return leaf.view as MarkdownView;
  }
}

function getField(
  key: MediaType,
  meta: CachedMetadata,
): InternalLinkField | ExternalLinkField | null {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter || !(key in frontmatter)) return null;
  const internalLink = frontmatterLinks?.find((link) => link.key === key);
  if (internalLink) {
    return {
      type: "internal",
      media: key,
      source: internalLink.link,
      original: internalLink.original,
    };
  }
  const content = frontmatter[key];
  if (typeof content !== "string") return null;
  const url = toURL(content);
  if (!url) return null;
  return {
    type: "external",
    media: key,
    source: url,
  };
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
