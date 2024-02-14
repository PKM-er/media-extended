import type { Component, Menu, View, ItemView } from "obsidian";
import type ReactDOM from "react-dom/client";
import type { MediaViewStoreApi } from "@/components/context";
import { toURL } from "@/lib/url";
import { saveScreenshot } from "@/media-note/timestamp/screenshot";
import { takeTimestamp } from "@/media-note/timestamp/timestamp";
import { openOrCreateMediaNote } from "@/media-note/timestamp/utils";
import type MediaExtended from "@/mx-main";
import type { MediaInfo } from "./media-info";
import type { MediaViewType } from "./view-type";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  containerEl: HTMLElement;
  getMediaInfo(): MediaInfo | null;
  root: ReactDOM.Root | null;
}

declare module "obsidian" {
  interface View {
    titleEl: HTMLElement;
  }
  interface WorkspaceLeaf {
    updateHeader(): void;
    containerEl: HTMLElement;
  }
  interface Workspace {
    requestActiveLeafEvents(): boolean;
  }
}

export function titleFromUrl(src: string): string {
  const url = toURL(src);
  if (!url) return "";
  const { pathname } = url;
  if (!pathname) return "";
  const finalPath = pathname.split("/").pop();
  if (!finalPath) return "";
  // remove extension
  return decodeURI(finalPath.split(".").slice(0, -1).join("."));
}

export function addAction(player: PlayerComponent & ItemView) {
  player.addAction("star", "Timestamp", () => {
    const info = player.getMediaInfo();
    if (!info) return;
    openOrCreateMediaNote(info, player).then((ctx) =>
      takeTimestamp(player, ctx),
    );
  });
  player.addAction("camera", "Screenshot", () => {
    const info = player.getMediaInfo();
    if (!info) return;
    openOrCreateMediaNote(info, player).then((ctx) =>
      saveScreenshot(player, ctx),
    );
  });
}

export function onPaneMenu<
  T extends PlayerComponent & {
    getViewType(): MediaViewType;
  } & View,
>(
  view: T,
  menu: Menu,
  menuSource: "sidebar-context-menu" | "tab-header" | "more-options",
) {
  const {
    player,
    source,
    toggleControls,
    controls,
    setTransform,
    transform,
    toggleWebFullscreen,
    disableWebFullscreen,
  } = view.store.getState();
  if (!player || !source) return;
  view.plugin.app.workspace.trigger(
    "mx-media-menu",
    menu,
    {
      source: source.url,
      player,
      toggleControls,
      controls,
      setTransform,
      transform,
      plugin: view.plugin,
      disableWebFullscreen,
      toggleWebFullscreen,
    },
    menuSource,
    view.leaf,
  );
}
