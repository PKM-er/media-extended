import { noHash } from "@/lib/url";
import type {
  MediaUrlViewType,
  MediaEmbedViewType,
  MediaWebpageViewType,
} from "@/media-view/view-type";
import {
  MEDIA_URL_VIEW_TYPE,
  MEDIA_EMBED_VIEW_TYPE,
  MEDIA_WEBPAGE_VIEW_TYPE,
} from "@/media-view/view-type";
import { matchHostForEmbed } from "@/web/match-embed";
import { matchHostForUrl } from "@/web/match-url";
import { matchHostForWeb, SupportedWebHost } from "@/web/match-webpage";

export interface UrlMediaInfo {
  viewType: MediaUrlViewType | MediaEmbedViewType | MediaWebpageViewType;
  source: URL;
  original: string;
  hash: string;
  cleanUrl: URL;
  isSameSource: (src: string) => boolean;
}

export function parseUrl(url: string | null | undefined): UrlMediaInfo | null {
  if (!url) return null;
  const directlinkInfo = matchHostForUrl(url);

  if (directlinkInfo) {
    return {
      viewType: MEDIA_URL_VIEW_TYPE[directlinkInfo.type],
      source: directlinkInfo.source,
      original: url,
      hash: directlinkInfo.source.hash,
      cleanUrl: directlinkInfo.cleanUrl,
      isSameSource: (src) => {
        const matched = matchHostForUrl(src);
        return (
          !!matched &&
          noHash(matched.cleanUrl) === noHash(directlinkInfo.cleanUrl)
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
      cleanUrl: webpageInfo.cleanUrl,
      isSameSource: (src) => {
        const matched = matchHostForWeb(src);
        return (
          !!matched && noHash(matched.cleanUrl) === noHash(webpageInfo.cleanUrl)
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
      cleanUrl: embedInfo.cleanUrl,
      isSameSource: (src) => {
        const matched = matchHostForEmbed(src);
        return (
          !!matched && noHash(matched.cleanUrl) === noHash(embedInfo.cleanUrl)
        );
      },
    };
  }
  return null;
}
