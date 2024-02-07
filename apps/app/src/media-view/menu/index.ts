import type { MediaPlayerInstance } from "@vidstack/react";
import type { MediaViewState } from "@/components/context";
import { parseFileInfo } from "@/media-note/note-index/file-info";
import { parseUrl } from "@/media-note/note-index/url-info";
import type MxPlugin from "@/mx-main";
import type { MediaViewType } from "../view-type";
import { isMediaFileViewType } from "../view-type";
import { muteMenu } from "./mute";
import { pipMenu } from "./pip";
import { speedMenu } from "./speed";
import { transformMenu } from "./transform";
import { urlMenu } from "./url";
import { webpageMenu } from "./webpage";

export interface PlayerContext {
  player: MediaPlayerInstance;
  source: {
    src: string;
    viewType: MediaViewType;
    original: string;
  };
  plugin: MxPlugin;
  setTransform: MediaViewState["setTransform"];
  transform: MediaViewState["transform"];
  hash: string;
  controls: boolean | undefined;
  toggleControls: (showCustom: boolean) => void;
}

declare module "obsidian" {
  interface Workspace {
    on(
      name: "mx-media-menu",
      callback: (
        menu: Menu,
        player: PlayerContext,
        source:
          | "player-menu-view"
          | "player-menu-embed"
          | "sidebar-context-menu"
          | "tab-header"
          | "more-options",
        leaf?: WorkspaceLeaf,
      ) => any,
      ctx?: any,
    ): EventRef;
    trigger(
      name: "mx-media-menu",
      menu: Menu,
      player: PlayerContext,
      source:
        | "player-menu-view"
        | "player-menu-embed"
        | "sidebar-context-menu"
        | "tab-header"
        | "more-options",
      leaf?: WorkspaceLeaf,
    ): void;
  }
}

export default function registerMediaMenu(this: MxPlugin) {
  this.registerEvent(
    this.app.workspace.on("mx-media-menu", (menu, ctx, source) => {
      if (source !== "sidebar-context-menu" && source !== "tab-header") {
        menu.addItem((item) => speedMenu(item, ctx.player));
        if (ctx.player.state.viewType === "video") {
          menu.addItem((item) => transformMenu(item, ctx));
          pipMenu(menu, ctx.player);
        }
      } else {
        muteMenu(menu, ctx.player);
      }
      if (source === "player-menu-embed") {
        const mediaInfo = isMediaFileViewType(ctx.source.viewType)
          ? parseFileInfo(ctx.source.original, ctx.hash, this.app.vault)
          : parseUrl(ctx.source.original, ctx.plugin);
        if (mediaInfo) {
          menu
            .addItem((item) =>
              item
                .setTitle("Open to the right")
                .setIcon("separator-vertical")
                .setSection("view")
                .onClick(() => {
                  this.leafOpener.openMedia(mediaInfo, "split");
                }),
            )
            .addItem((item) =>
              item
                .setTitle("Open in new tab")
                .setSection("view")
                .setIcon("file-plus")
                .onClick(() => {
                  this.leafOpener.openMedia(mediaInfo, "tab");
                }),
            )
            .addItem((item) =>
              item
                .setTitle("Open in new window")
                .setSection("view")
                .setIcon("maximize")
                .onClick(() => {
                  this.leafOpener.openMedia(mediaInfo, "window");
                }),
            );
        }
      }
      webpageMenu(menu, ctx, source);
      if (source === "player-menu-embed" || source === "more-options") {
        urlMenu(menu, ctx);
      }
    }),
  );
}
