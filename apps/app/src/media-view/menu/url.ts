import type { Menu } from "obsidian";
import type { PlayerContext } from ".";

export function urlMenu(menu: Menu, { source }: PlayerContext) {
  if (source.isFileUrl) return;
  menu.addItem((item) =>
    item
      .setTitle("Open in browser")
      .setIcon("globe")
      .setSection("view")
      .onClick(() => {
        window.open(source.href);
      }),
  );
}
