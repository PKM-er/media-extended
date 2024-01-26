import type { MediaPlayerInstance } from "@vidstack/react";
import type { MediaViewType } from "@/media-note/note-index";
import type MxPlugin from "@/mx-main";
import "obsidian";
import { muteMenu } from "./mute";
import { pipMenu } from "./pip";
import { speedMenu } from "./speed";
import { urlMenu } from "./url";
import { webpageMenu } from "./webpage";

export interface PlayerContext {
  player: MediaPlayerInstance;
  source: {
    src: string;
    viewType: MediaViewType;
    original: string;
  };
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
  interface MenuItem {
    setSubmenu(): Menu;
  }
}

export default function registerMediaMenu(this: MxPlugin) {
  this.registerEvent(
    this.app.workspace.on("mx-media-menu", (menu, ctx, source) => {
      if (source !== "sidebar-context-menu" && source !== "tab-header") {
        menu.addItem((item) => speedMenu(item, ctx.player));
        pipMenu(menu, ctx.player);
      } else {
        muteMenu(menu, ctx.player);
      }
      webpageMenu(menu, ctx, source);
      urlMenu(menu, ctx);
    }),
  );
}
