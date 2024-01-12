import { toURL } from "@/lib/url";
import { checkMediaType } from "@/patch/utils";

export function matchHostForUrl(link: string | undefined): {
  type: "audio" | "video";
  source: URL;
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const source = toURL(link);
  if (!source) return null;
  const ext = source.pathname.split(".").pop();
  if (!ext) return null;
  const mediaType = checkMediaType(ext);
  if (!mediaType) return null;

  const cleanUrl = new URL(source);
  cleanUrl.searchParams.sort();
  return {
    type: mediaType,
    source,
    cleanUrl,
  };
}
