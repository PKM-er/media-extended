import "obsidian";

import { createLeafBySplit } from "@feature/open-media/smart-view-open";
import MediaExtended from "@plugin";
import { around } from "monkey-around";
import { WorkspaceLeaf } from "obsidian";

import { MediaView } from ".";
import { MEDIA_VIEW_TYPE } from "./common";
declare module "obsidian" {
  interface WorkspaceLeaf {
    pinned: boolean;
  }
}

const isPinned = (leaf: WorkspaceLeaf) => leaf.pinned || isPinnedMedia(leaf);
const isPinnedMedia = (leaf: WorkspaceLeaf) =>
  leaf.view instanceof MediaView && leaf.view.pinned;

const getUnpinnedLeaf = () => {
  let active = app.workspace.activeLeaf,
    unpinned: WorkspaceLeaf | null = active;
  if (unpinned && !isPinned(unpinned)) return unpinned;
  unpinned = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!isPinned(leaf) && leaf.view.navigation) {
      if (!unpinned || unpinned.activeTime < leaf.activeTime) unpinned = leaf;
      return true;
    }
  });
  if (!unpinned) {
    if (active) return createLeafBySplit(active);
    unpinned = app.workspace.createLeafInParent(app.workspace.rootSplit, -1);
  }
  return unpinned;
};

const patchLeaf = (plugin: MediaExtended) => {
  plugin.register(
    around(WorkspaceLeaf.prototype, {
      openFile: (next) =>
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        function (this: WorkspaceLeaf, file, state, ...args) {
          if (!state) {
            state = { eState: { fromLink: true } };
            state.eState.fromLink = true;
          } else if (!state.eState) {
            state.eState = { fromLink: true };
          } else {
            state.eState.fromLink = true;
          }
          return next.call(this, file, state, ...args);
        },
      setViewState: (next) =>
        function (this: WorkspaceLeaf, state, eState, ...args) {
          const fallback = () => next.call(this, state, eState, ...args);
          if (isPinnedMedia(this) && state.type !== MEDIA_VIEW_TYPE) {
            return getUnpinnedLeaf().setViewState(state, eState, ...args);
          }
          return fallback();
        },
    }),
  );
};
export default patchLeaf;
