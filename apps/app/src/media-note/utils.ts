import { Notice } from "obsidian";
import type { App, MarkdownView, Editor, TFile, Workspace } from "obsidian";
import { openInLeaf } from "@/media-note/link-click/external";
import { openInOpenedPlayer } from "@/media-note/link-click/opened";
import type { MediaInfo } from "./manager";
import { isFileMediaInfo } from "./manager/file-info";
import { parseUrl } from "./manager/url-info";

/**
 * @param sourcePath path where new note will be created from
 * @returns
 */
export async function openMarkdownView(
  notes: TFile[],
  newNoteTitle: string,
  toNewNoteFm: (sourcePath: string) => Record<string, any>,
  sourcePath: string,
  { workspace, fileManager, vault }: App,
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

export async function openMedia(
  mediaInfo: MediaInfo,
  ctx: { workspace: Workspace },
) {
  const leaf = ctx.workspace.getLeaf("split", "vertical");
  if (isFileMediaInfo(mediaInfo)) {
    await leaf.openFile(mediaInfo.file, {
      eState: { subpath: mediaInfo.hash },
    });
  } else {
    const urlInfo = parseUrl(mediaInfo.source.href);
    if (!urlInfo) {
      new Notice(
        `Failed to open media url ${mediaInfo.source.href}, invalid url or not supported`,
      );
      return;
    }
    if (openInOpenedPlayer(urlInfo, ctx.workspace)) return;
    await openInLeaf(urlInfo, leaf);
  }
}
