import type { MediaPlayerInstance, TextTrackInit } from "@vidstack/react";
import type { App } from "obsidian";
import { createContext, useContext } from "react";
// eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
import { createStore, useStore } from "zustand";
import noop from "@/lib/no-op";
import type { ScreenshotInfo } from "@/lib/screenshot";
import type MediaExtended from "@/mx-main";
import type { SupportedWebHost } from "@/web/match-webpage";

export interface MediaViewState {
  player: MediaPlayerInstance | null;
  playerRef: React.RefCallback<MediaPlayerInstance>;
  source:
    | {
        src: string;
        type?: string;
      }
    | undefined;
  hash: string;
  title: string;
  textTracks: TextTrackInit[];
  webHost?: Exclude<SupportedWebHost, SupportedWebHost.Generic>;
  updateWebHost: (webHost: SupportedWebHost) => void;
}

export function createMediaViewStore() {
  return createStore<MediaViewState>((set) => ({
    player: null,
    playerRef: (inst) => set({ player: inst }),
    source: undefined,
    hash: "",
    title: "",
    textTracks: [],
    updateWebHost: (webHost) =>
      set({ webHost: webHost === "generic" ? undefined : webHost }),
  }));
}

export type MediaViewStoreApi = ReturnType<typeof createMediaViewStore>;

export const MediaViewContext = createContext<{
  store: MediaViewStoreApi;
  plugin: MediaExtended;
  embed: boolean;
  onScreenshot?: (info: ScreenshotInfo) => any;
  onTimestamp?: (timestamp: number) => any;
}>(null as any);

export function useMediaViewStore<U>(
  selector: (state: MediaViewState) => U,
): U {
  const { store } = useContext(MediaViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(store, selector);
}

export function useMediaViewStoreInst() {
  const { store } = useContext(MediaViewContext);
  return store;
}

export function useApp<U>(selector: (state: App) => U): U {
  return selector(useContext(MediaViewContext).plugin.app);
}

export function useScreenshot() {
  return useContext(MediaViewContext).onScreenshot;
}
export function useTimestamp() {
  return useContext(MediaViewContext).onTimestamp;
}
export const useIsEmbed = () => useContext(MediaViewContext).embed;

export function onPlayerMounted(
  store: MediaViewStoreApi,
  callback: (
    player: MediaPlayerInstance,
  ) => (() => void) | (() => void)[] | void,
) {
  let prevUnload = noop;
  const unloads: (() => void)[] = [
    () => prevUnload(),
    store.subscribe((curr, prev) => {
      if (curr.player === prev.player) return;
      prevUnload();
      if (!curr.player) return;
      const unload = callback(curr.player);
      if (!unload) {
        prevUnload = noop;
      } else if (Array.isArray(unload)) {
        prevUnload = () => unload.forEach((u) => u());
      } else {
        prevUnload = unload;
      }
    }),
  ];
  return () => unloads.forEach((u) => u());
}
