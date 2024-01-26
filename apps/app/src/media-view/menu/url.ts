import type { Menu } from "obsidian";
import { decodeWebpageUrl, isWebpageUrl } from "@/lib/remote-player/encode";
import { isMediaFileViewType } from "../view-type";
import type { PlayerContext } from ".";

export function urlMenu(menu: Menu, { source }: PlayerContext) {
  const isUrl = source.src.startsWith("http"),
    isWebpageEncoded = isWebpageUrl(source.src);
  if (isMediaFileViewType(source.viewType) || (!isUrl && !isWebpageEncoded))
    return;
  const url = isWebpageEncoded ? decodeWebpageUrl(source.src) : source.src;
  menu.addItem((item) =>
    item
      .setTitle("Open in browser")
      .setIcon("globe")
      .setSection("view")
      .onClick(() => {
        window.open(url);
      }),
  );
}
