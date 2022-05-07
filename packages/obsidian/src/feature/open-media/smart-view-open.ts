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

export type ViewFilter = (leaf: WorkspaceLeaf) => boolean;
/**
 * @returns the most recent MediaView with given url opened
 */
export const findMediaView = (filterFn?: ViewFilter) => {
  const leaves = app.workspace.getLeavesOfType(MEDIA_VIEW_TYPE).sort(sortFn);
  if (filterFn) return leaves.filter(filterFn)[0];
  else return leaves[0];
};

/**
 * @param url url without hash
 */
export const filterMediaViewByUrl =
  (url: string): ViewFilter =>
  ({ view }) =>
    view.getState().url === url;

export const filterMediaViewByFile =
  (file: TFile): ViewFilter =>
  ({ view }) =>
    view.getState().file === file.path;

const sortFn = (a: WorkspaceLeaf, b: WorkspaceLeaf) => {
  const aView = a.view as MediaView,
    bView = b.view as MediaView;
  const comparePinned = +bView.pinned - +aView.pinned;
  if (comparePinned !== 0) return comparePinned;
  return b.activeTime - a.activeTime;
};
