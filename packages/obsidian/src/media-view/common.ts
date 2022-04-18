import type { PlayerStore } from "@player";
import type { Component, KeymapEventHandler, Scope } from "obsidian";

export const MEDIA_VIEW_TYPE = "media-view-v2";

export interface PlayerComponent extends Component {
  store: PlayerStore;
  scope: Scope;
  keymap: KeymapEventHandler[];
}

export const unloadKeymap = (scope: Scope, keymap: KeymapEventHandler[]) => {
  keymap.forEach((k) => scope.unregister(k));
};

interface MediaStateBase {
  fragment?: [number, number] | null;
  currentTime?: number;
}

export interface MediaFileState extends MediaStateBase {
  file: string;
  url: undefined;
}
export interface MediaUrlState extends MediaStateBase {
  file: null;
  url: string;
}
export type MediaState = MediaUrlState | MediaFileState;
