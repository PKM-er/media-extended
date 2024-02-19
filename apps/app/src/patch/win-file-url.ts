// https://forum.obsidian.md/t/incorrect-file-urls-generated-by-drop-on-windows/22429/3

import { Platform } from "obsidian";
import { toURL } from "@/lib/url";

export function patchWin32FileUrl(
  url: string | URL | null | undefined,
): URL | null {
  if (!url) return null;
  url = url instanceof URL ? url : toURL(url);
  if (Platform.isWin) return url;
  if (!url || url.protocol !== "file:" || !url.pathname.includes("%5C"))
    return url;
  url.pathname = url.pathname.replaceAll(/%5C/g, "/");
  return url;
}
