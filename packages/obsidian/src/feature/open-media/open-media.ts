import { getFragFromHash } from "@base/hash-tool";
import { vaildateMediaURL } from "@base/url-parse";
import { getMostRecentViewOfType } from "@misc";
import {
  MEDIA_VIEW_TYPE,
  MediaFileState,
  MediaUrlState,
  MediaView,
} from "@view";
import { TFile, ViewState, WorkspaceLeaf } from "obsidian";

import {
  createLeafBySplit,
  findMediaViewByFile,
  findMediaViewByUrl,
} from "./smart-view-open";

const getViewState = (type: "url" | "file", link: string, hash: string) => {
  let state: MediaUrlState | MediaFileState;
  if (type === "url") {
    state = { url: link, file: null, fragment: null };
  } else {
    state = { file: link, fragment: null };
  }
  state = { ...state, fragment: getFragFromHash(hash) };
  return { type: MEDIA_VIEW_TYPE, active: true, state };
};
const getEphemeralState = (hash: string, fromLink: boolean) => ({
  subpath: hash,
  fromLink,
});

export const openMediaLink = (
  url: string,
  fromLink: boolean,
  newLeaf = false,
) =>
  vaildateMediaURL(url, (url, hash) => {
    const viewState = getViewState("url", url, hash),
      findMediaView = () => findMediaViewByUrl(url);
    return openMediaView(viewState, hash, fromLink, findMediaView, newLeaf);
  });

export const openMediaLinkInHoverEditor = (
  url: string,
  initiatingEl: HTMLElement,
  event: MouseEvent,
) => {
  let hoverEditor = app.plugins.plugins["obsidian-hover-editor"];
  if (!hoverEditor) return false;
  return vaildateMediaURL(url, async (url, hash) => {
    const viewState = getViewState("url", url, hash),
      eState = getEphemeralState(hash, true);
    app.workspace.trigger("hover-link", { event } as any);
    const leaf = hoverEditor.spawnPopover(
      initiatingEl,
      undefined,
      false,
    ) as WorkspaceLeaf;
    await leaf.setViewState(viewState, eState);
  });
};
const openMediaView = async (
  viewState: ViewState,
  hash: string,
  fromLink: boolean,
  findMediaView: () => MediaView | null,
  newLeaf: boolean,
) => {
  let view: MediaView | null;
  const setViewState = (leaf: WorkspaceLeaf) =>
    leaf.setViewState(viewState, getEphemeralState(hash, fromLink));
  if (newLeaf) {
    const leaf = createLeafBySplit(app.workspace.getLeaf());
    await setViewState(leaf);
  } else if ((view = findMediaView())) {
    let state = view.leaf.getViewState();
    state.state = { ...state.state, fragment: getFragFromHash(hash) };
    await setViewState(view.leaf);
  } else if ((view = getMostRecentViewOfType(MediaView))) {
    await setViewState(view.leaf);
  } else {
    await setViewState(app.workspace.getLeaf());
  }
  return true;
};

export const openMediaFile = async (
  file: TFile,
  hash: string,
  fromLink: boolean,
  newLeaf = false,
): Promise<boolean> => {
  if (app.viewRegistry.getTypeByExtension(file.extension) !== MEDIA_VIEW_TYPE)
    return false;
  const viewState = getViewState("file", file.path, hash),
    findMediaView = () => findMediaViewByFile(file);
  return openMediaView(viewState, hash, fromLink, findMediaView, newLeaf);
};
