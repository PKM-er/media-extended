import type { MediaPlayerInstance } from "@vidstack/react";
import type { MediaViewState } from "@/components/context";
import { canProviderScreenshot } from "@/components/player/screenshot";
import { handleExternalLinkMenu } from "@/media-note/link-click";
import { copyScreenshot } from "@/media-note/timestamp/screenshot";
import type MxPlugin from "@/mx-main";
import type { MediaURL } from "@/web/url-match";
import type { MediaViewType } from "../view-type";
import { muteMenu } from "./mute";
import { pipMenu } from "./pip";
import { speedMenu } from "./speed";
import { transformMenu } from "./transform";
import { urlMenu } from "./url";
import { webpageMenu } from "./webpage";

export interface PlayerContext {
  player: MediaPlayerInstance;
  source: MediaURL;
  plugin: MxPlugin;
  reload: () => void;
  viewType: MediaViewType;
  setTransform: MediaViewState["setTransform"];
  transform: MediaViewState["transform"];
  controls: boolean | undefined;
  disableWebFullscreen: boolean | undefined;
  toggleWebFullscreen: (enableWebFs: boolean) => void;
  toggleControls: (showCustom: boolean) => void;
}

declare module "obsidian" {
  interface Workspace {
    on(name: "url-menu", callback: (menu: Menu, link: string) => any): EventRef;
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
  handleExternalLinkMenu(this);
  this.registerEvent(
    this.app.workspace.on("mx-media-menu", (menu, ctx, source) => {
      if (
        source === "more-options" ||
        source === "sidebar-context-menu" ||
        source === "tab-header" ||
        source === "player-menu-embed"
      ) {
        menu.addItem((item) =>
          item
            .setTitle("Refresh")
            .setSection("action")
            .setIcon("reset")
            .onClick(() => {
              ctx.reload();
            }),
        );
      }
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
        const mediaInfo = ctx.source;
        menu
          .addItem((item) =>
            item
              .setTitle("Open to the right")
              .setIcon("separator-vertical")
              .setSection("open")
              .onClick(() => {
                this.leafOpener.openMedia(mediaInfo, "split");
              }),
          )
          .addItem((item) =>
            item
              .setTitle("Open in new tab")
              .setSection("open")
              .setIcon("file-plus")
              .onClick(() => {
                this.leafOpener.openMedia(mediaInfo, "tab");
              }),
          )
          .addItem((item) =>
            item
              .setTitle("Open in new window")
              .setSection("open")
              .setIcon("maximize")
              .onClick(() => {
                this.leafOpener.openMedia(mediaInfo, "window");
              }),
          );
      }
      webpageMenu(menu, ctx, source);
      if (source === "player-menu-embed" || source === "more-options") {
        urlMenu(menu, ctx);
      }

      const provider = ctx.player.provider;
      if (
        (source === "player-menu-embed" ||
          source === "more-options" ||
          source === "sidebar-context-menu") &&
        canProviderScreenshot(provider)
      ) {
        menu.addItem((item) =>
          item
            .setTitle("Copy Screenshot")
            .setSection("action")
            .setIcon("focus")
            .onClick(() => {
              copyScreenshot({
                app: this.app,
                media: ctx.source,
                provider,
                settings: this.settings.getState(),
                state: ctx.player.state,
              });
            }),
        );
      }
    }),
  );
}
