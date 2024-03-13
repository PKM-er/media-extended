import { Notice, type Menu } from "obsidian";
import { openAsMenu } from "./open-as";
import type { PlayerContext } from ".";

export function urlMenu(
  menu: Menu,
  { source, plugin, viewType, player }: PlayerContext,
) {
  if (source.isFileUrl) return;
  const original = source.jsonState.source;
  const withTime = source.print({ start: player.currentTime, end: -1 });
  menu.addItem((item) =>
    item
      .setTitle("Copy URL")
      .setIcon("clipboard")
      .setSection("view")
      .onClick(() => {
        navigator.clipboard.writeText(original);
        new Notice("URL copied to clipboard");
      }),
  );
  if (withTime !== original) {
    menu.addItem((item) =>
      item
        .setTitle("Copy URL with time")
        .setIcon("clipboard")
        .setSection("view")
        .onClick(() => {
          navigator.clipboard.writeText(withTime);
          new Notice("URL with time copied to clipboard");
        }),
    );
  }

  menu.addItem((item) =>
    item
      .setTitle("Open link in default browser")
      .setIcon("globe")
      .setSection("view")
      .onClick(() => {
        window.open(withTime);
      }),
  );
  const supported = plugin.urlViewType.getSupported(source);
  const current = viewType;
  const targetViewTypes = supported.filter((t) => t !== current);
  openAsMenu(menu, {
    mode: "always",
    open: false,
    url: source,
    plugin,
    targetViewTypes,
  });
}
