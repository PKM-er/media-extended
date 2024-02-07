import { Platform } from "obsidian";
import { noHashUrl, toURL } from "@/lib/url";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/media-type";

const allowedProtocols = new Set(["https:", "http:", "app:", "file:", "mx:"]);

export function revertMxProtocol(src: URL, plugin: MxPlugin) {
  if (src.protocol !== "mx:") return src;

  // custom protocol take // as part of the pathname
  const [, , mxProtocol] = src.pathname.split("/");
  const replace = plugin.settings.getState().getUrlMapping(mxProtocol);
  if (!replace) return src;
  return toURL(
    src.href.replace(`mx://${mxProtocol}/`, replace.replace(/\/*$/, "/")),
  );
}
export function matchHostForUrl(
  link: string | undefined,
  plugin: MxPlugin,
): {
  type: "audio" | "video";
  source: URL;
  cleanUrl: URL;
} | null {
  if (!link) return null;
  const linkUrl = toURL(link);
  if (!linkUrl) return null;
  if (!allowedProtocols.has(linkUrl.protocol)) return null;
  const linkUrlMx = revertMxProtocol(linkUrl, plugin);
  if (!linkUrlMx) return null;

  const cleanUrl = noHashUrl(linkUrl);
  cleanUrl.searchParams.sort();

  const ext = linkUrlMx.pathname.split(".").pop();
  if (!ext) return null;
  const mediaType = checkMediaType(ext);
  if (!mediaType) return null;

  return {
    type: mediaType,
    source: fixFileUrl(linkUrlMx),
    cleanUrl,
  };
}

function fixFileUrl(url: URL): URL {
  if (url.protocol !== "file:") return url;
  const fixed = new URL(
    url.href.substring(url.origin.length),
    Platform.resourcePathPrefix,
  );
  fixed.search = Date.now().toString();
  return fixed;
}

export function revertAppUrl(url: URL): URL {
  if (!url.href.startsWith(Platform.resourcePathPrefix)) return url;
  return new URL(url.href.substring(url.origin.length), "file:///");
}
