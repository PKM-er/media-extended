import type { MediaPlayerInstance } from "@vidstack/react";
import type { Menu } from "obsidian";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";

export function pipMenu(menu: Menu, player: MediaPlayerInstance) {
  const isVideo = player.state.viewType === "video";
  const isWebview = player.provider instanceof WebiviewMediaProvider;
  // webview not support pip yet
  if (!isVideo || isWebview) return;
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
