import { Platform } from "obsidian";
import { toURL } from "@/lib/url";
import { checkMediaType } from "@/patch/media-type";

const allowedProtocols = new Set(["https:", "http:", "app:", "file:"]);

export function matchHostForUrl(link: string | undefined): {
  type: "audio" | "video";
  source: URL;
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const src = toURL(link);
  if (!src) return null;
  if (!allowedProtocols.has(src.protocol)) return null;
  const ext = src.pathname.split(".").pop();
  if (!ext) return null;
  const mediaType = checkMediaType(ext);
  if (!mediaType) return null;

  const cleanUrl = new URL(src);
  cleanUrl.searchParams.sort();
  return {
    type: mediaType,
    source: fixFileUrl(src),
    cleanUrl: revertAppUrl(cleanUrl),
  };
}

function fixFileUrl(url: URL): URL {
  if (url.protocol !== "file:") return url;
  const fixed = new URL(url.pathname, Platform.resourcePathPrefix);
  fixed.search = Date.now().toString();
  return fixed;
}

function revertAppUrl(url: URL): URL {
  if (!url.href.startsWith(Platform.resourcePathPrefix)) return url;
  return new URL(url.pathname, "file:///");
}
