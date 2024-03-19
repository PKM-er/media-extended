import type { Menu } from "obsidian";
import { Notice, Platform } from "obsidian";
import type { MediaURL } from "@/info/media-url";
import { showItemInFolder, openPath } from "../../media-note/link-click";

export function fileOperations(url: MediaURL, menu: Menu) {
  if (Platform.isDesktopApp && url.isFileUrl && url.filePath) {
    const filePath = url.filePath;
    menu
      .addItem((item) =>
        item
          .setIcon("folder")
          .setTitle(
            Platform.isMacOS ? "Reveal in Finder" : "Show in system explorer",
          )
          .setSection("view")
          .onClick(() => {
            showItemInFolder(filePath).catch((err) => {
              new Notice(
                `Failed to open file in file explorer: ${err.message}`,
              );
              console.error("Failed to open file in file explorer", err);
            });
          }),
      )
      .addItem((item) =>
        item
          .setIcon("arrow-up-right")
          .setTitle("Open in default player")
          .setSection("view")
          .onClick(() => {
            openPath(filePath).catch((err) => {
              new Notice(
                `Failed to open file in system player: ${err.message}`,
              );
              console.error("Failed to open file in system player", err);
            });
          }),
      );
  }
}
