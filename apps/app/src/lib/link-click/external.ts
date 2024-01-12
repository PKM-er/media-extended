import type { Workspace, WorkspaceLeaf } from "obsidian";
import {
  MEDIA_EMBED_VIEW_TYPE,
  type MediaEmbedViewState,
} from "@/media-view/iframe-view";
import { MEDIA_URL_VIEW_TYPE } from "@/media-view/url-view";
import {
  MEDIA_WEBPAGE_VIEW_TYPE,
  type MediaWebpageViewState,
} from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { matchHostForEmbed } from "@/web/match-embed";
import { matchHostForUrl } from "@/web/match-url";
import { matchHostForWeb, SupportedWebHost } from "@/web/match-webpage";
import { noHash } from "../url";

interface UrlInfo {
  viewType: string;
  source: URL;
  original: string;
  hash: string;
  isSameSource: (src: string) => boolean;
}
export function parseUrl(url: string): UrlInfo | null {
  const directlinkInfo = matchHostForUrl(url);

  if (directlinkInfo) {
    return {
      viewType: MEDIA_URL_VIEW_TYPE[directlinkInfo.type],
      source: directlinkInfo.source,
      original: url,
      hash: directlinkInfo.source.hash,
      isSameSource: (src) => {
        const matched = matchHostForUrl(src);
        return (
          !!matched &&
          noHash(matched.cleanUrl) === noHash(directlinkInfo.cleanUrl)
        );
      },
    };
  }

  const embedInfo = matchHostForEmbed(url);

  if (embedInfo) {
    return {
      viewType: MEDIA_EMBED_VIEW_TYPE,
      source: embedInfo.source,
      original: url,
      hash: embedInfo.source.hash,
      isSameSource: (src) => {
        const matched = matchHostForEmbed(src);
        return (
          !!matched && noHash(matched.cleanUrl) === noHash(embedInfo.cleanUrl)
        );
      },
    };
  }

  const webpageInfo = matchHostForWeb(url);
  if (webpageInfo && webpageInfo.type !== SupportedWebHost.Generic) {
    return {
      viewType: MEDIA_WEBPAGE_VIEW_TYPE,
      source: webpageInfo.source,
      original: url,
      hash: webpageInfo.source.hash,
      isSameSource: (src) => {
        const matched = matchHostForWeb(src);
        return (
          !!matched && noHash(matched.cleanUrl) === noHash(webpageInfo.cleanUrl)
        );
      },
    };
  }
  return null;
}

export function openInOpenedPlayer(
  { hash, isSameSource, viewType }: UrlInfo,
  workspace: Workspace,
) {
  const opened = workspace.getLeavesOfType(viewType).filter((l) => {
    const { source } = l.view.getState() as
      | MediaEmbedViewState
      | MediaWebpageViewState;
    return source && isSameSource(source);
  });
  if (opened.length > 0) {
    opened[0].setEphemeralState({ subpath: hash });
    return true;
  }
  return false;
}

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

export async function openInLeaf(info: UrlInfo, leaf: WorkspaceLeaf) {
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
