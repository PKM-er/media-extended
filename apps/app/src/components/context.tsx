import type { MediaPlayerInstance } from "@vidstack/react";
import type { App } from "obsidian";
import { createContext, createRef, useContext } from "react";
// eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
import { createStore, useStore } from "zustand";
import type MediaExtended from "@/mx-main";
import type { LastState } from "./use-window-migration";

export interface MediaViewState {
  playerRef: React.RefObject<MediaPlayerInstance>;
  source:
    | {
        src: string;
        type?: string;
      }
    | undefined;
  hash: string;
  title: string;
  lastStateRef: React.MutableRefObject<LastState | null>;
}

export function createMediaViewStore() {
  return createStore<MediaViewState>(() => ({
    playerRef: createRef<MediaPlayerInstance>(),
    source: undefined,
    hash: "",
    title: "",
    lastStateRef: createRef<LastState>(),
  }));
}

export type MediaViewStoreApi = ReturnType<typeof createMediaViewStore>;

export const MediaViewContext = createContext<{
  store: MediaViewStoreApi;
  plugin: MediaExtended;
  embed: boolean;
}>(null as any);

export const useIsEmbed = () => useContext(MediaViewContext).embed;

export function useMediaViewStore<U>(
  selector: (state: MediaViewState) => U,
): U {
  const { store } = useContext(MediaViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(store, selector);
}

export function useApp<U>(selector: (state: App) => U): U {
  return selector(useContext(MediaViewContext).plugin.app);
}

// export function usePlugin<U>(selector: (state: MediaExtended) => U): U {
//   return selector(useContext(MediaViewContext).plugin);
// }
