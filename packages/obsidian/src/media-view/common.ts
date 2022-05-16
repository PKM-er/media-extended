import type { PlayerStore } from "@player";
import { createStore as _createStore } from "@player/store/ob-store";
import { setPlatform } from "@slice/action";
import { Component, KeymapEventHandler, Platform, Scope } from "obsidian";

import type MediaExtended from "../mx-main";

export const MEDIA_VIEW_TYPE = "media-view-v2";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: PlayerStore;
  port: MessagePort | null;
  scope: Scope;
}

export const createStore = (name: string) => {
  const store = _createStore(name);
  store.dispatch(setPlatform(Platform.isSafari ? "ios" : "other"));
  return store;
};

export interface MediaStateBase {
  fragment?: [number, number] | null;
  currentTime?: number;
  duration?: number | null;
  pinned?: boolean;
}

export interface MediaFileState extends MediaStateBase {
  file: string;
  url?: undefined;
}
export interface MediaUrlState extends MediaStateBase {
  file: null;
  url: string;
}
export type MediaState = MediaUrlState | MediaFileState;
