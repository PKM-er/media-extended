import { MediaProviderElement } from "@aidenlx/player";
import { TimeSpan } from "mx-lib";
import type { App } from "obsidian";
import React from "react";

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

export const RevealInEditorClass = "vid-reveal-in-editor";

export interface ControlsProps {
  timeSpan: TimeSpan | null;
  player: React.RefObject<MediaProviderElement>;
}

export const ControlsContext = React.createContext<ControlsProps>({} as any);
