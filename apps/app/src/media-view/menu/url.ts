import type { Menu } from "obsidian";
import { isMediaFileViewType } from "../view-type";
import type { PlayerContext } from ".";

export function urlMenu(menu: Menu, { source }: PlayerContext) {
  if (isMediaFileViewType(source.viewType) || !source.src.startsWith("http"))
    return;
  menu.addItem((item) =>
    item
      .setTitle("Open in browser")
      .setIcon("globe")
      .setSection("view")
      .onClick(() => {
        window.open(source.src);
      }),
  );
}
