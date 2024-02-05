import { updateHash } from "@/lib/hash/format";
import { parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl, toURL } from "@/lib/url";
import { matchYouTube } from "./url-match/yt";

export type SupportedEmbedHost = "vimeo" | "youtube";

export function matchHostForEmbed(link: string | undefined): {
  type: SupportedEmbedHost;
  source: URL;
  // url used to compare if two embeds are the same
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const url = toURL(link);
  if (!url) return null;
  switch (true) {
    case url.hostname.contains("youtu.be"):
    case url.hostname.contains("youtube"): {
      const result = matchYouTube(url);
      if (!result) return null;
      return {
        type: "youtube",
        ...result,
      };
    }
    case url.hostname.contains("vimeo"): {
      const cleanUrl = noHashUrl(url);
      cleanUrl.search = "";

      const source = new URL(url);
      const tempFrag = parseTempFrag(source.hash);
      updateHash(source, tempFrag);

      return {
        type: "vimeo",
        cleanUrl,
        source,
      };
    }
    default:
      return null;
  }
}
