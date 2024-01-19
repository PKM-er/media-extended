/* eslint-disable deprecation/deprecation */
import type {
  PaneType,
  App,
  SplitDirection,
  WorkspaceLeaf,
  TFile,
  MarkdownView,
  Editor,
} from "obsidian";
import type { MediaEmbedViewState } from "@/media-view/iframe-view";
import type { MediaUrlViewState } from "@/media-view/url-view";
import type { MediaWebpageViewState } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import type { MediaInfo } from "../manager";
import { isFileMediaInfo } from "../manager/file-info";
import type { UrlMediaInfo } from "../manager/url-info";
import { filterFileLeaf, filterUrlLeaf, sortByMtime } from "./utils";

interface NewNoteInfo {
  title: string;
  fm: (newNotePath: string) => Record<string, any>;
  sourcePath?: string;
}

export class LeafOpener {
  app: App;
  constructor(public plugin: MxPlugin) {
    this.app = plugin.app;
  }

  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: "split",
    direction?: SplitDirection,
  ): Promise<void>;
  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: PaneType | boolean,
  ): Promise<void>;
  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: PaneType | boolean,
    direction?: SplitDirection,
  ): Promise<void> {
    const { workspace } = this.app;
    if (!newLeaf && this.#openInExistingPlayer(mediaInfo)) {
      return;
    }
    const leaf = workspace.getLeaf(newLeaf as any, direction);
    if (isFileMediaInfo(mediaInfo)) {
      await leaf.openFile(mediaInfo.file, {
        eState: { subpath: mediaInfo.hash },
      });
    } else {
      await openInLeaf(mediaInfo, leaf);
    }
  }

  #getLeavesOfMedia(info: MediaInfo) {
    const { workspace } = this.app;

    return workspace.getLeavesOfType(info.viewType).filter((leaf) => {
      if (isFileMediaInfo(info)) {
        return filterFileLeaf(leaf, info);
      } else {
        return filterUrlLeaf(leaf, info);
      }
    });
  }

  #openInExistingPlayer(info: MediaInfo): boolean {
    const opened = this.#getLeavesOfMedia(info);
    if (opened.length > 0) {
      updateHash(info.hash, opened[0]);
      return true;
    }
    return false;
  }

  async openNote(
    mediaInfo: MediaInfo,
    newNoteInfo: NewNoteInfo,
    newLeaf?: "split",
    direction?: SplitDirection,
  ): Promise<{ file: TFile; editor: Editor }>;
  async openNote(
    mediaInfo: MediaInfo,
    newNoteInfo: NewNoteInfo,
    newLeaf?: PaneType | boolean,
  ): Promise<{ file: TFile; editor: Editor }>;
  async openNote(
    mediaInfo: MediaInfo,
    newNoteInfo: NewNoteInfo,
    newLeaf?: PaneType | boolean,
    direction?: SplitDirection,
  ): Promise<{ file: TFile; editor: Editor }> {
    const notes = this.plugin.mediaNote.findNotes(mediaInfo);
    if (!newLeaf) {
      const opened = this.#getOpenedNote(notes);
      if (opened) return opened;
    }

    let targetNote: TFile;
    if (notes.length === 0) {
      const filename = `Media Note - ${newNoteInfo.title}.md`;
      targetNote = await this.#createNewNote(
        filename,
        newNoteInfo.fm,
        newNoteInfo.sourcePath ?? "",
      );
    } else {
      targetNote = notes.sort(sortByMtime).at(0)!;
    }

    const leaf = this.app.workspace.getLeaf(newLeaf as any, direction);
    await leaf.openFile(targetNote);
    return {
      file: targetNote,
      editor: (leaf.view as MarkdownView).editor,
    };
  }

  #getOpenedNote(notes: TFile[]): { file: TFile; editor: Editor } | null {
    const { workspace } = this.app;
    const opened = workspace.getLeavesOfType("markdown").filter((leaf) => {
      const filePath = (leaf.view as MarkdownView).file?.path;
      return !!filePath && notes.some((note) => note.path === filePath);
    }) as (WorkspaceLeaf & { view: MarkdownView & { file: TFile } })[];
    if (opened.length === 0) return null;
    const view = (
      opened.find((leaf) => leaf === workspace.activeLeaf) ??
      opened.sort((a, b) => sortByMtime(a.view.file, b.view.file)).at(0)!
    ).view;
    return { file: view.file, editor: view.editor };
  }
  async #createNewNote(
    filename: string,
    fm: (sourcePath: string) => Record<string, any>,
    sourcePath = "",
  ) {
    const { fileManager, vault } = this.app;
    const folder = fileManager.getNewFileParent(sourcePath, filename);
    const newNote = await vault.create(`${folder.path}/${filename}`, "");
    await fileManager.processFrontMatter(newNote, (fn) => {
      Object.assign(fn, fm(newNote.path));
    });
    return newNote;
  }
}

function updateHash(hash: string, leaf: WorkspaceLeaf) {
  leaf.setEphemeralState({ subpath: hash });
}
async function openInLeaf(info: UrlMediaInfo, leaf: WorkspaceLeaf) {
  const state: MediaEmbedViewState | MediaWebpageViewState | MediaUrlViewState =
    { source: info.original };
  await leaf.setViewState(
    {
      type: info.viewType,
      state,
      active: true,
    },
    { subpath: info.hash },
  );
}
