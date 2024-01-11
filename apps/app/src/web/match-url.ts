import { noHash, toURL } from "@/lib/url";
import { checkMediaType } from "@/patch/utils";

export function matchHostForUrl(link: string | undefined): {
  type: "audio" | "video";
  url: string;
  hash: string;
  noHash: string;
} | null {
  if (!link) return null;
  const url = toURL(link);
  if (!url) return null;
  const ext = url.pathname.split(".").pop();
  if (!ext) return null;
  const mediaType = checkMediaType(ext);
  if (!mediaType) return null;
  return {
    type: mediaType,
    url: link,
    hash: url.hash,
    noHash: noHash(url),
  };
}
