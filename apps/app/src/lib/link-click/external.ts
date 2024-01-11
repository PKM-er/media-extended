import {
  MEDIA_EMBED_VIEW_TYPE,
  type MediaEmbedViewState,
} from "@/media-view/iframe-view";
import {
  MEDIA_WEBPAGE_VIEW_TYPE,
  type MediaWebpageViewState,
} from "@/media-view/webpage-view";
import type MxPlugin from "@/mx-main";
import { matchHostForWeb, SupportedWebHost } from "@/web/match";
import { matchHostForEmbed } from "@/web/match-embed";

function parseUrl(url: string): {
  viewType: string;
  source: string;
  hash: string;
  isSameSource: (src: string) => boolean;
} | null {
  const embedInfo = matchHostForEmbed(url);

  if (embedInfo) {
    return {
      viewType: MEDIA_EMBED_VIEW_TYPE,
      source: embedInfo.noHash,
      hash: embedInfo.hash,
      isSameSource: (src) => src === embedInfo.noHash,
    };
  }

  const webpageInfo = matchHostForWeb(url);
  if (webpageInfo && webpageInfo.type !== SupportedWebHost.Generic) {
    return {
      viewType: MEDIA_WEBPAGE_VIEW_TYPE,
      source: webpageInfo.url,
      hash: webpageInfo.hash,
      isSameSource: (src) => {
        const matched = matchHostForWeb(src);
        return !!matched && matched.noHash === webpageInfo.noHash;
      },
    };
  }
  return null;
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
  const { viewType, source, hash, isSameSource } = urlInfo;

  const opened = workspace.getLeavesOfType(viewType).filter((l) => {
    const { source } = l.view.getState() as
      | MediaEmbedViewState
      | MediaWebpageViewState;
    return source && isSameSource(source);
  });
  if (opened.length > 0 && !newLeaf) {
    opened[0].setEphemeralState({ subpath: hash });
    return;
  }
  const leaf = newLeaf
    ? workspace.getLeaf("split", "vertical")
    : workspace.getLeaf(false);

  await leaf.setViewState(
    {
      type: viewType,
      state: { source },
      active: true,
    },
    { subpath: hash },
  );
}
