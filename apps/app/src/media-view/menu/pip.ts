import type { MediaPlayerInstance } from "@vidstack/react";
import type { Menu } from "obsidian";

export function pipMenu(menu: Menu, player: MediaPlayerInstance) {
  if (!player.state.canPictureInPicture) return;
  if (!player.state.pictureInPicture) {
    menu.addItem((item) =>
      item
        .setTitle("Picture in Picture")
        .setSection("mx-player")
        .setIcon("picture-in-picture")
        .onClick(() => player.enterPictureInPicture()),
    );
  } else {
    menu.addItem((item) =>
      item
        .setTitle("Exit Picture in Picture")
        .setIcon("picture-in-picture-2")
        .setSection("mx-player")
        .onClick(() => player.exitPictureInPicture()),
    );
  }
}
