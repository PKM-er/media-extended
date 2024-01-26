import type { MediaPlayerInstance } from "@vidstack/react";
import type { Menu } from "obsidian";

export function muteMenu(menu: Menu, player: MediaPlayerInstance) {
  const muted = player.muted;
  menu.addItem((item) =>
    item
      .setSection("mx-player")
      .setIcon(muted ? "volume-off" : "volume-up")
      .setTitle(muted ? "Unmute" : "Mute")
      .onClick(() => {
        player.muted = !muted;
      }),
  );
}
