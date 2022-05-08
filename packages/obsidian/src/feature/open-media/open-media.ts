import { getFragFromHash } from "@base/hash-tool";
import { vaildateMediaURL } from "@base/url-parse";
import { getMostRecentLeafOfView, getMostRecentViewOfType } from "@misc";
import {
  MEDIA_VIEW_TYPE,
  MediaFileState,
  MediaUrlState,
  MediaView,
} from "@view";
import { TFile, ViewState, WorkspaceLeaf } from "obsidian";

import {
  createLeafBySplit,
  filterMediaViewByFile,
  filterMediaViewByUrl,
  findMediaView,
  ViewFilter,
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
  vaildateMediaURL(url, (url, hash) =>
    openMediaView(
      { state: getViewState("url", url, hash), hash },
      filterMediaViewByUrl(url),
      { fromLink, newLeaf },
    ),
  );

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

/**
 * @param isSameMedia filter to determine if media is the same
 */
const openMediaView = async (
  info: { state: ViewState; hash: string },
  isSameMedia: ViewFilter,
  options?: Partial<{ fromLink: boolean; newLeaf: boolean }>,
) => {
  const { fromLink = false, newLeaf = false } = options ?? {};
  let leaf: WorkspaceLeaf | undefined | null;
  if (newLeaf) {
    leaf = createLeafBySplit(app.workspace.getUnpinnedLeaf());
  } else {
    leaf =
      findMediaView(isSameMedia) ?? findMediaView() ?? app.workspace.getLeaf();
  }
  if (leaf) {
    await leaf.setViewState(info.state, getEphemeralState(info.hash, fromLink));
    return true;
  } else return false;
};

export const openMediaFile = async (
  file: TFile,
  hash: string,
  fromLink: boolean,
  newLeaf = false,
): Promise<boolean> => {
  if (app.viewRegistry.getTypeByExtension(file.extension) !== MEDIA_VIEW_TYPE)
    return false;
  return openMediaView(
    { state: getViewState("file", file.path, hash), hash },
    filterMediaViewByFile(file),
    { fromLink, newLeaf },
  );
};
