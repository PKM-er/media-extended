/* eslint-disable deprecation/deprecation */
import type {
  App,
  Editor,
  PaneType,
  SplitDirection,
  TFile,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import { Component, MarkdownView, debounce } from "obsidian";
import type { MediaEmbedViewState } from "@/media-view/iframe-view";
import type { MediaUrlViewState } from "@/media-view/url-view";
import type { MediaView } from "@/media-view/view-type";
import { isMediaViewType } from "@/media-view/view-type";
import type { MediaWebpageViewState } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import type { MediaInfo } from "../note-index";
import { isFileMediaInfo } from "../note-index/file-info";
import type { UrlMediaInfo } from "../note-index/url-info";
import { filterFileLeaf, filterUrlLeaf, sortByMtime } from "./utils";
import "./active.global.less";

declare module "obsidian" {
  interface WorkspaceLeaf {
    activeTime: number;
    tabHeaderEl: HTMLDivElement;
  }
}

export interface NewNoteInfo {
  title: string;
  fm: (newNotePath: string) => Record<string, any>;
  sourcePath?: string;
}

const mediaLeafActiveClass = "mx-media-active";

export class LeafOpener extends Component {
  app: App;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }

  activeMediaLeaf: MediaLeaf | null = null;

  onload(): void {
    const workspace = this.app.workspace;
    workspace.onLayoutReady(() => {
      this.onLeafUpdate();
    });
    this.registerEvent(
      workspace.on("active-leaf-change", (leaf) => {
        this.onLeafUpdate(leaf);
      }),
    );
    this.registerEvent(
      workspace.on("layout-change", () => {
        this.onLeafUpdate();
      }),
    );
  }
  onunload(): void {
    this.applyActiveMediaLeaf(null);
  }

  get workspace() {
    return this.app.workspace;
  }

  onLeafUpdate = debounce((nowLeaf?: WorkspaceLeaf | null) => {
    nowLeaf = nowLeaf ?? this.workspace.activeLeaf;
    this.onActiveLeafChange(nowLeaf);
  }, 200);

  onActiveLeafChange(nowLeaf: WorkspaceLeaf | null) {
    const newActiveMediaLeaf = this.detectActiveMediaLeaf(nowLeaf);
    if (this.activeMediaLeaf === newActiveMediaLeaf) return;
    this.applyActiveMediaLeaf(newActiveMediaLeaf);
  }

  applyActiveMediaLeaf(leaf: MediaLeaf | null) {
    this.activeMediaLeaf?.tabHeaderEl.removeClass(mediaLeafActiveClass);
    this.activeMediaLeaf?.containerEl.removeClass(mediaLeafActiveClass);
    leaf?.tabHeaderEl.addClass(mediaLeafActiveClass);
    leaf?.containerEl.addClass(mediaLeafActiveClass);
    this.activeMediaLeaf = leaf;
  }

  detectActiveMediaLeaf(active: WorkspaceLeaf | null): MediaLeaf | null {
    const fallback = () => getAllMediaLeaves(this.workspace).at(0) ?? null;
    if (!active) return fallback();
    if (isMediaLeaf(active)) return active;

    if (active.view instanceof MarkdownView && active.view.file) {
      const { mediaNote } = this.plugin;
      const mediaInfo = mediaNote.findMedia(active.view.file);
      if (mediaInfo) {
        // if the note is a media note, only accept corresponding media leaves
        // don't use the latest media leaf as fallback
        const leaf = this.findExistingPlayer(mediaInfo);
        return leaf;
      }
    }
    // for other cases like non-media note, use the latest media leaf as fallback
    return fallback();
  }

  findExistingPlayer(info: MediaInfo) {
    const leaves = getMediaLeavesOf(info, this.workspace);
    if (leaves.length === 0) return null;
    return leaves[0];
  }

  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: "split",
    direction?: SplitDirection,
  ): Promise<MediaLeaf>;
  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: PaneType | boolean,
  ): Promise<MediaLeaf>;
  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: PaneType | boolean,
    direction?: SplitDirection,
  ): Promise<MediaLeaf> {
    const { workspace } = this.app;
    if (!newLeaf) {
      const existing = this.#openInExistingPlayer(mediaInfo);
      if (existing) return existing;
    }
    const leaf = workspace.getLeaf(newLeaf as any, direction);
    if (isFileMediaInfo(mediaInfo)) {
      await leaf.openFile(mediaInfo.file, {
        eState: { subpath: mediaInfo.hash },
      });
    } else {
      await openInLeaf(mediaInfo, leaf);
    }
    return leaf as MediaLeaf;
  }

  #openInExistingPlayer(info: MediaInfo): MediaLeaf | null {
    const opened = this.findExistingPlayer(info);
    if (opened) {
      updateHash(info.hash, opened);
      return opened;
    }
    return null;
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
    newLeaf: PaneType | boolean = "split",
    direction: SplitDirection = "vertical",
  ): Promise<{ file: TFile; editor: Editor }> {
    const notes = this.plugin.mediaNote.findNotes(mediaInfo);
    const opened = this.#getOpenedNote(notes);
    if (opened) return opened;

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

export type MediaLeaf = WorkspaceLeaf & { view: MediaView };

/**
 * @returns all media leaves in the workspace, sorted by active time
 */
function getAllMediaLeaves(workspace: Workspace) {
  const leaves: WorkspaceLeaf[] = [];
  workspace.iterateAllLeaves((leaf) => {
    if (isMediaViewType(leaf.view.getViewType())) {
      leaves.push(leaf);
    }
  });
  leaves.sort(byActiveTime);
  return leaves as MediaLeaf[];
}

function getMediaLeavesOf(info: MediaInfo, workspace: Workspace) {
  const leaves = workspace.getLeavesOfType(info.viewType).filter((leaf) => {
    if (isFileMediaInfo(info)) {
      return filterFileLeaf(leaf, info);
    } else {
      return filterUrlLeaf(leaf, info);
    }
  });
  leaves.sort(byActiveTime);
  return leaves as MediaLeaf[];
}

export function isMediaLeaf(leaf: WorkspaceLeaf | null): leaf is MediaLeaf {
  return !!leaf && isMediaViewType(leaf.view.getViewType());
}

function byActiveTime(a: WorkspaceLeaf, b: WorkspaceLeaf) {
  return b.activeTime - a.activeTime;
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
