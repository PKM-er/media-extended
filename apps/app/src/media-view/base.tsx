import type { MediaPlayerInstance } from "@vidstack/react";
import type { Component, Menu, View, ItemView, TFile } from "obsidian";
import type ReactDOM from "react-dom/client";
import type { MediaViewStoreApi } from "@/components/context";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { getTracks } from "@/lib/subtitle";
import { toURL } from "@/lib/url";
import { saveScreenshot } from "@/media-note/timestamp/screenshot";
import { takeTimestamp } from "@/media-note/timestamp/timestamp";
import { openOrCreateMediaNote } from "@/media-note/timestamp/utils";
import type MediaExtended from "@/mx-main";
import { fromFile } from "@/web/url-match";
import type { MediaInfo } from "./media-info";
import type { MediaViewType } from "./view-type";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  containerEl: HTMLElement;
  getMediaInfo(): MediaInfo | null;
  root: ReactDOM.Root | null;
}

export async function setTempFrag(
  hash: string,
  store: MediaViewStoreApi,
  initial = false,
) {
  store.setState({ hash });
  const tf = parseTempFrag(hash);
  if (!tf) return;
  const player = await new Promise<MediaPlayerInstance>((resolve) => {
    const player = store.getState().player;
    if (player) resolve(player);
    else {
      const unsubscribe = store.subscribe(({ player }) => {
        if (player) {
          unsubscribe();
          resolve(player);
        }
      });
    }
  });
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let _newTime: number | null = null;
  // allow 0.25s offset from end, in case delay in seeking
  const allowedOffset = 0.25;
  if (
    isTimestamp(tf) ||
    player.currentTime < tf.start ||
    Math.abs(player.currentTime - tf.end) < allowedOffset
  ) {
    _newTime = tf.start;
  } else if (player.currentTime - allowedOffset > tf.end) {
    _newTime = tf.end;
  }
  if (_newTime !== null) {
    const newTime = _newTime;
    player.currentTime = newTime;
    // trying to fix youtube iframe autoplay on initial seek
    if (
      !player.state.canPlay &&
      ["video/youtube"].includes(player.state.source.type) &&
      !player.state.autoPlay
    ) {
      await waitFor(player, "seeked");
      await player.pause();
    }
  }

  if (isTimestamp(tf) && player.state.canPlay && !initial) {
    player.play(new Event("hashchange"));
  }
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

function waitFor(
  player: MediaPlayerInstance,
  event:
    | "time-update"
    | "play"
    | "can-play"
    | "canplay"
    | "timeupdate"
    | "seeking"
    | "seeked",
) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve();
      unload();
    }, 5e3);
    const unload = player.listen(event, () => {
      resolve();
      window.clearTimeout(timeout);
      unload();
    });
  });
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
    hash,
    setTransform,
    transform,
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
      hash,
      setTransform,
      transform,
      plugin: view.plugin,
    },
    menuSource,
    view.leaf,
  );
}

export async function loadFile(file: TFile, player: PlayerComponent) {
  const { vault } = player.plugin.app;
  const textTracks = await getTracks(file, vault);
  player.store.setState({
    source: { url: fromFile(file, vault) },
    textTracks,
    title: file.name,
  });
}
