import { MediaProviderElement } from "@vidstack/player";
import { TimeSpan } from "mx-lib";
import type { App } from "obsidian";
import React from "preact/compat";

// import type MediaExtended from "../mx-main";
import { MediaViewEvents } from "./events";

interface PlayerContext {
  app: App;
  // plugin: MediaExtended;
  inEditor: boolean;
  events: MediaViewEvents;
  containerEl: HTMLElement;
}

export const PlayerContext = React.createContext<PlayerContext>({} as any);

export interface ControlsProps {
  timeSpan: TimeSpan | null;
  player: React.Ref<MediaProviderElement>;
}

export const ControlsContext = React.createContext<ControlsProps>({} as any);
