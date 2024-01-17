import type { WorkspaceLeaf } from "obsidian";
import type { MediaEmbedViewState } from "@/media-view/iframe-view";
import type { MediaWebpageViewState } from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import type { UrlMediaInfo } from "../manager/url-info";
import { parseUrl } from "../manager/url-info";
import { openInOpenedPlayer } from "./opened";

export async function onExternalLinkClick(
  this: MxPlugin,
  url: string,
  newLeaf: boolean,
  fallback: () => void,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const { workspace } = this.app;

  const urlInfo = parseUrl(url);
  if (!urlInfo) {
    fallback();
    return;
  }
  if (!newLeaf && openInOpenedPlayer(urlInfo, workspace)) return;

  const leaf = newLeaf
    ? workspace.getLeaf("split", "vertical")
    : workspace.getLeaf(false);

  await openInLeaf(urlInfo, leaf);
}

export async function openInLeaf(info: UrlMediaInfo, leaf: WorkspaceLeaf) {
  const state: MediaEmbedViewState | MediaWebpageViewState = {
    source: info.original,
  };
  await leaf.setViewState(
    {
      type: info.viewType,
      state,
      active: true,
    },
    { subpath: info.hash },
  );
}
