/* eslint-disable deprecation/deprecation */
import filenamify from "filenamify/browser";
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
import type { MediaInfo } from "@/media-view/media-info";
import { isFileMediaInfo } from "@/media-view/media-info";
import type { MediaUrlViewState } from "@/media-view/url-view";
import type {
  MediaView,
  MediaViewType,
  RemoteMediaViewType,
} from "@/media-view/view-type";
import { isMediaViewType } from "@/media-view/view-type";
import type { MediaWebpageViewState } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { filterFileLeaf, filterUrlLeaf, sortByMtime } from "./utils";
import "./active.global.less";

declare module "obsidian" {
  interface WorkspaceLeaf {
    activeTime: number;
    tabHeaderEl: HTMLDivElement;
    pinned: boolean;
    togglePinned(): void;
  }
  interface WorkspaceTabGroup {
    children: WorkspaceLeaf[];
  }
  interface Workspace {
    activeTabGroup: WorkspaceTabGroup | null;
  }
  interface FileManager {
    createNewFile(
      folder: TFolder,
      name: string,
      ext: string,
      content?: string,
    ): Promise<TFile>;
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
    const fallback = () => {
      const pinned = this.findPinnedPlayer();
      if (pinned) return pinned;
      const leaves = getAllMediaLeaves(this.workspace);
      const { activeTabGroup } = this.workspace;
      const activeMediaLeaf =
        (!active || !activeTabGroup
          ? leaves
          : leaves.filter((leaf) => !activeTabGroup.children.includes(leaf))
        ).at(0) ?? null;
      return activeMediaLeaf;
    };
    if (!active) return fallback();
    if (isMediaLeaf(active)) return active;

    if (active.view instanceof MarkdownView && active.view.file) {
      const { mediaNote } = this.plugin;
      const mediaInfo = mediaNote.findMedia(active.view.file);
      if (mediaInfo) {
        // if the note is a media note, only accept corresponding media leaves
        // don't use the latest media leaf as fallback
        const leaf = this.findPlayerWithSameMedia(mediaInfo);
        return leaf;
      }
    }
    // for other cases like non-media note, use the latest media leaf as fallback
    return fallback();
  }

  findPlayerWithSameMedia(info: MediaInfo): MediaLeaf | null {
    for (const type of this.plugin.urlViewType.getSupported(info)) {
      const leaves = getMediaLeavesOf(info, type, this.workspace);
      if (leaves.length > 0) return leaves[0];
    }
    return null;
  }
  findPinnedPlayer(): MediaLeaf | null {
    return (
      getAllMediaLeaves(this.workspace).filter((leaf) => leaf.pinned)[0] ?? null
    );
  }

  get settings() {
    return this.plugin.settings.getState();
  }

  getSplitBehavior(
    newLeaf: PaneType | boolean | undefined,
  ): PaneType | boolean {
    const {
      defaultMxLinkClick: { click, alt },
    } = this.settings;
    if (click === null) {
      return newLeaf ?? false;
    }
    if (newLeaf === undefined || newLeaf === false) {
      return click;
    }
    // alt only works as a replacement of original click behavior
    // eg, if click is set to "split", original split action (cmd+alt)
    // is replaced by behavior set in alt
    if (alt !== null && newLeaf === click) {
      return alt;
    }
    return newLeaf;
  }

  /**
   * @param newLeaf if undefined, use default behavior
   */
  async openMedia(
    mediaInfo: MediaInfo,
    newLeaf?: PaneType | false,
    {
      direction,
      viewType,
      fromUser,
    }: {
      viewType?: RemoteMediaViewType;
      direction?: SplitDirection;
      /**
       * if true, treat newLeaf as click action
       * and apply preference behavior
       */
      fromUser?: boolean;
    } = {},
  ): Promise<MediaLeaf> {
    const { workspace } = this.app;
    if (!newLeaf) {
      const existing = await this.#openInExistingPlayer(mediaInfo, viewType);
      if (existing) return existing;
    }

    const leaf = workspace.getLeaf(
      (!fromUser ? newLeaf : this.getSplitBehavior(newLeaf)) as "split",
      direction,
    );
    return this.#openMedia(leaf, mediaInfo, viewType);
  }

  async #openMedia(
    leaf: WorkspaceLeaf,
    mediaInfo: MediaInfo,
    viewType?: RemoteMediaViewType,
  ) {
    if (isFileMediaInfo(mediaInfo)) {
      await leaf.openFile(mediaInfo.file, {
        eState: { subpath: mediaInfo.hash },
        active: true,
      });
    } else {
      const state:
        | MediaEmbedViewState
        | MediaWebpageViewState
        | MediaUrlViewState = {
        source: mediaInfo.jsonState.source,
      };
      viewType ??= this.plugin.urlViewType.getPreferred(mediaInfo);
      await leaf.setViewState(
        {
          type: viewType,
          state,
          active: true,
        },
        { subpath: mediaInfo.hash },
      );
    }
    return leaf as MediaLeaf;
  }

  async #openInExistingPlayer(
    info: MediaInfo,
    remoteViewType?: RemoteMediaViewType,
  ): Promise<MediaLeaf | null> {
    const pinned = this.findPinnedPlayer();
    if (pinned) {
      return await this.#openMedia(pinned, info, remoteViewType);
    }
    const opened = this.findPlayerWithSameMedia(info);
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
    if (opened) {
      if (opened.getMode() !== "source") {
        await opened.setState({ mode: "source" }, { history: false });
      }
      return opened;
    }

    let targetNote: TFile;
    if (notes.length === 0) {
      const title = filenamify(newNoteInfo.title, { replacement: "_" });
      const filename = `Media Note - ${title}`;
      targetNote = await this.#createNewNote(
        filename,
        newNoteInfo.fm,
        newNoteInfo.sourcePath ?? "",
      );
    } else {
      targetNote = notes.sort(sortByMtime).at(0)!;
    }

    const leaf = this.app.workspace.getLeaf(newLeaf as any, direction);
    await leaf.openFile(targetNote, { state: { mode: "source" } });
    return {
      file: targetNote,
      editor: (leaf.view as MarkdownView).editor,
    };
  }

  #getOpenedNote(notes: TFile[]): (MarkdownView & { file: TFile }) | null {
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
    return view;
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
}

export type MediaLeaf = WorkspaceLeaf & { view: MediaView };

/**
 * @returns all media leaves in the workspace, sorted by active time
 */
function getAllMediaLeaves(workspace: Workspace) {
  const leaves: WorkspaceLeaf[] = [];
  workspace.iterateRootLeaves((leaf) => {
    if (isMediaViewType(leaf.view.getViewType())) {
      leaves.push(leaf);
    }
  });
  leaves.sort(byActiveTime);
  return leaves as MediaLeaf[];
}

function getMediaLeavesOf(
  info: MediaInfo,
  viewType: MediaViewType,
  workspace: Workspace,
) {
  const leaves = workspace.getLeavesOfType(viewType).filter((leaf) => {
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

export function byActiveTime(a: WorkspaceLeaf, b: WorkspaceLeaf) {
  return b.activeTime - a.activeTime;
}

function updateHash(hash: string, leaf: WorkspaceLeaf) {
  leaf.setEphemeralState({ subpath: hash });
}
