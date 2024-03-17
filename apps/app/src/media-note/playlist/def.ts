/* eslint-disable @typescript-eslint/naming-convention */
import type { TFile } from "obsidian";
import type { MediaType } from "@/patch/media-type";
import { type MediaURL } from "@/web/url-match";

export const taskSymbolMediaTypeMap = {
  ">": "video",
  "^": "audio",
  _: "subtitle",
  "#": "generic",
  "/": "chapter",
} satisfies Record<string, MediaType | "generic" | "subtitle" | "chapter">;
export type MediaTaskSymbol = keyof typeof taskSymbolMediaTypeMap;
export type MediaTaskSymbolType =
  (typeof taskSymbolMediaTypeMap)[MediaTaskSymbol];

export function isMediaTaskSymbol(
  symbol: string | undefined,
): symbol is MediaTaskSymbol {
  return !!symbol && symbol in taskSymbolMediaTypeMap;
}

declare module "obsidian" {
  interface MetadataCache {
    on(name: "mx-playlist-change", callback: () => void): EventRef;
    trigger(name: "mx-playlist-change"): void;
  }
}

export interface Playlist {
  file: TFile;
  title: string;
  list: PlaylistItem[];
}
export interface PlaylistWithActive extends Playlist {
  active: number;
}
export interface PlaylistItem {
  media: MediaURL | null;
  title: string;
  type: MediaTaskSymbolType;
  /**
   * Index of the parent item in the list
   */
  parent: number;
}
export interface PlaylistItemWithMedia extends PlaylistItem {
  media: MediaURL;
}

export function isWithMedia(item: PlaylistItem): item is PlaylistItemWithMedia {
  return !!item.media;
}

export function findWithMedia(
  list: PlaylistItem[],
  predicate: (
    item: PlaylistItemWithMedia,
    i: number,
    arr: PlaylistItem[],
  ) => boolean,
  {
    fromIndex,
    reverse = false,
  }: { fromIndex?: number; reverse?: boolean } = {},
): PlaylistItemWithMedia | null {
  if (reverse) {
    for (let i = fromIndex ?? list.length - 1; i >= 0; i--) {
      const item = list[i];
      if (item && isWithMedia(item) && predicate(item, i, list)) return item;
    }
  } else {
    for (let i = fromIndex ?? 0; i < list.length; i++) {
      const item = list[i];
      if (item && isWithMedia(item) && predicate(item, i, list)) return item;
    }
  }
  return null;
}

export const emptyLists: PlaylistWithActive[] = [];
