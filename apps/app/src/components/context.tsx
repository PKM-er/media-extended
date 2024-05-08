import type { MediaPlayerInstance } from "@vidstack/react";
import type { App, TFile, Vault } from "obsidian";
import { createContext, useContext } from "react";
// eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
import { createStore, useStore } from "zustand";
import { type MediaURL } from "@/info/media-url";
import type { MediaHost } from "@/info/supported";
import type { LoadedTextTrack, WebsiteTextTrack } from "@/info/track-info";
import { parseHashProps, type HashProps } from "@/lib/hash/hash-prop";
import { TimeoutError } from "@/lib/message";
import noop from "@/lib/no-op";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import type { ScreenshotInfo } from "@/lib/screenshot";
import type {
  Playlist,
  PlaylistItemWithMedia,
} from "@/media-note/playlist/def";
import { titleFromUrl } from "@/media-view/base";
import {
  MEDIA_FILE_VIEW_TYPE,
  type MediaViewType,
} from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import type { MxSettings } from "@/settings/def";
import { type MediaInfo, mediaInfoFromFile } from "../info/media-info";
import { applyTempFrag, handleTempFrag } from "./state/apply-tf";
import { handleCueUpdate } from "./state/handle-cue-update";

export interface TransformConfig {
  rotate: "90" | "180" | "270";
  flipHorizontal: boolean;
  flipVertical: boolean;
  zoom: number;
}

export interface SourceFacet {
  hash?: string;
  /**
   * true: auto detect title from url
   */
  title?: string | true;
  viewType: MediaViewType;
  textTracks?: LoadedTextTrack[];
}

export interface MediaViewState {
  player: MediaPlayerInstance | null;
  setPlayer: React.RefCallback<MediaPlayerInstance>;
  source:
    | {
        url: MediaInfo;
        viewType: MediaViewType;
      }
    | undefined;
  title: string;
  hash: HashProps;
  setHash: (hash: string) => void;
  getPlayer(): Promise<MediaPlayerInstance>;
  loadFile(file: TFile, ctx: { vault: Vault; subpath?: string }): Promise<void>;
  setSource(url: MediaURL, other: SourceFacet): void;
  setTextTracks(tracks: LoadedTextTrack[]): void;
  transform: Partial<TransformConfig> | null;
  setTransform: (transform: Partial<TransformConfig> | null) => void;
  controls?: boolean;
  disableWebFullscreen?: boolean;
  toggleControls: (showCustom: boolean) => void;
  toggleWebFullscreen: (enableWebFs: boolean) => void;
  textTracks: { local: LoadedTextTrack[]; remote: WebsiteTextTrack[] };
  webHost?: Exclude<MediaHost, MediaHost.Generic>;
  updateWebHost: (webHost: MediaHost) => void;
  updateWebsiteTracks: (tracks: WebsiteTextTrack[]) => void;
}

export function createMediaViewStore(plugin: MxPlugin) {
  const store = createStore<MediaViewState>((set, get, store) => ({
    player: null,
    setPlayer: (inst) => {
      set({ player: inst });
    },
    source: undefined,
    hash: {
      autoplay: undefined,
      controls: undefined,
      loop: undefined,
      muted: undefined,
      tempFragment: null,
      volume: undefined,
    },
    setTextTracks(tracks) {
      set(({ textTracks }) => ({
        textTracks: { ...textTracks, local: tracks },
      }));
    },
    async getPlayer(timeout = 10e3) {
      const { player } = get();
      if (player) return player;
      return new Promise((resolve, reject) => {
        const unsubscribe = store.subscribe(({ player }) => {
          if (!player) return;
          unsubscribe();
          resolve(player);
          window.clearTimeout(timeoutId);
        });
        const timeoutId = window.setTimeout(() => {
          unsubscribe();
          reject(new TimeoutError(timeout));
        }, timeout);
      });
    },
    setSource(url, { hash, viewType, title, textTracks }) {
      set((og) => ({
        source: {
          ...og.source,
          viewType,
          url,
        },
        textTracks: {
          local: textTracks ?? og.textTracks.local,
          remote: og.textTracks.remote,
        },
        hash: { ...og.hash, ...parseHashProps(hash || url.hash) },
        title:
          (title === true ? titleFromUrl(url.source.href) : title) ?? og.title,
      }));
      applyTempFrag(get());
    },
    setHash(hash) {
      set((og) => ({ hash: { ...og.hash, ...parseHashProps(hash) } }));
      applyTempFrag(get());
    },
    async loadFile(file, { subpath }) {
      const url = mediaInfoFromFile(file, subpath ?? "");
      if (!url) {
        throw new Error("Invalid media file: " + file.path);
      }
      const textTracks = await plugin.transcript.getTracks(url);
      set(({ source, hash, textTracks: { remote } }) => ({
        source: { ...source, url, viewType: MEDIA_FILE_VIEW_TYPE[url.type] },
        textTracks: { local: textTracks, remote },
        title: file.name,
        hash: subpath ? { ...hash, ...parseHashProps(subpath) } : hash,
      }));
      await applyTempFrag(get());
    },
    title: "",
    transform: null,
    setTransform: (transform: Partial<TransformConfig> | null) => {
      if (!transform) {
        set({ transform: null });
      } else {
        set((prev) => {
          const newState = { transform: { ...prev.transform, ...transform } };
          if (
            newState.transform.flipHorizontal &&
            newState.transform.flipVertical &&
            newState.transform.rotate === "180"
          ) {
            // reset to default
            newState.transform = {
              ...newState.transform,
              flipHorizontal: false,
              flipVertical: false,
              rotate: undefined,
            };
          }
          return newState;
        });
      }
    },
    toggleControls(showCustom) {
      const { player } = get();
      set({ controls: showCustom });
      if (player && player.provider instanceof WebiviewMediaProvider) {
        player.provider.media.send("mx-toggle-controls", !showCustom);
      }
    },
    toggleWebFullscreen(enableWebFs) {
      const { player } = get();
      set({ disableWebFullscreen: !enableWebFs });
      if (player && player.provider instanceof WebiviewMediaProvider) {
        player.provider.media.send("mx-toggle-webfs", enableWebFs);
      }
    },
    textTracks: { local: [], remote: [] },
    updateWebsiteTracks: (tracks) =>
      set(({ textTracks }) => ({
        textTracks: { ...textTracks, remote: tracks },
      })),
    updateWebHost: (webHost) =>
      set({ webHost: webHost === "generic" ? undefined : webHost }),
  }));

  handleTempFrag(store);
  handleCueUpdate(store, plugin.app.workspace);
  return store;
}

export type MediaViewStoreApi = ReturnType<typeof createMediaViewStore>;

export const MediaViewContext = createContext<{
  store: MediaViewStoreApi;
  plugin: MxPlugin;
  embed: boolean;
  reload: () => void;
  onScreenshot?: (info: ScreenshotInfo) => any;
  onTimestamp?: (timestamp: number) => any;
  onPlaylistChange?: (item: PlaylistItemWithMedia, list: Playlist) => any;
}>(null as any);

export function useMediaViewStore<U>(
  selector: (state: MediaViewState) => U,
): U {
  const { store } = useContext(MediaViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(store, selector);
}

export function useSettings<U>(selector: (state: MxSettings) => U): U {
  const {
    plugin: { settings },
  } = useContext(MediaViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(settings, selector);
}

export function useMediaViewStoreInst() {
  const { store } = useContext(MediaViewContext);
  return store;
}

export function useReload() {
  return useContext(MediaViewContext).reload;
}

export function useApp(): App;
export function useApp<U>(selector: (state: App) => U): U;
export function useApp<U>(selector?: (state: App) => U): U | App {
  const app = useContext(MediaViewContext).plugin.app;
  if (!selector) return app;
  return selector(app);
}
export function usePlugin() {
  return useContext(MediaViewContext).plugin;
}

export function useScreenshot() {
  return useContext(MediaViewContext).onScreenshot;
}
export function usePlaylistChange() {
  return useContext(MediaViewContext).onPlaylistChange;
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
