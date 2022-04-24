import { MEDIA_VIEW_TYPE, MediaView } from "@view";
import { SplitDirection, TFile, WorkspaceLeaf } from "obsidian";

/**
 * smart createLeafBySplit that respect screen ratio
 */
export const createLeafBySplit = (leaf: WorkspaceLeaf): WorkspaceLeaf => {
  const { workspace } = app;
  const vw = workspace.rootSplit.containerEl?.clientWidth;
  const vh = workspace.rootSplit.containerEl?.clientHeight;
  let direction: SplitDirection;
  if (vh && vw) {
    if (vh < vw) direction = "vertical";
    else direction = "horizontal";
  } else {
    console.error(
      "no containerEl for rootSplit, fallback to horizontal",
      workspace.rootSplit,
    );
    direction = "horizontal";
  }
  return workspace.createLeafBySplit(leaf, direction);
};

/**
 * @param url url without hash
 * @returns the most recent MediaView with given url opened
 */
export const findMediaViewByUrl = (url: string): MediaView | null => {
  return (
    (app.workspace
      .getLeavesOfType(MEDIA_VIEW_TYPE)
      .filter(({ view }) => view.getState().url === url)
      .sort((a, b) => b.activeTime - a.activeTime)[0]?.view as
      | MediaView
      | undefined) ?? null
  );
};

/**
 * @returns the most recent MediaView with given file opened
 */
export const findMediaViewByFile = (file: TFile): MediaView | null =>
  (app.workspace
    .getLeavesOfType(MEDIA_VIEW_TYPE)
    .filter(({ view }) => view.getState().file === file.path)
    .sort((a, b) => b.activeTime - a.activeTime)[0]?.view as
    | MediaView
    | undefined) ?? null;
