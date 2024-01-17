import { noHash } from "@/lib/url";
import { MEDIA_EMBED_VIEW_TYPE } from "@/media-view/iframe-view";
import type { MediaEmbedViewType } from "@/media-view/iframe-view";
import type { MediaUrlViewType } from "@/media-view/url-view";
import { MEDIA_URL_VIEW_TYPE } from "@/media-view/url-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "@/media-view/webpage-view";
import type { MediaWebpageViewType } from "@/media-view/webpage-view";
import { matchHostForEmbed } from "@/web/match-embed";
import { matchHostForUrl } from "@/web/match-url";
import { matchHostForWeb, SupportedWebHost } from "@/web/match-webpage";

export interface UrlMediaInfo {
  viewType: MediaUrlViewType | MediaEmbedViewType | MediaWebpageViewType;
  source: URL;
  original: string;
  hash: string;
  isSameSource: (src: string) => boolean;
}
export function parseUrl(url: string | null): UrlMediaInfo | null {
  if (!url) return null;
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
