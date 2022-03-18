import type { App } from "obsidian";
import React from "react";

import type MediaExtended from "../mx-main";
import { MediaViewEvents } from "./events";

interface PlayerContext {
  app: App;
  // plugin: MediaExtended;
  inEditor: boolean;
  events: MediaViewEvents;
}

export const PlayerContext = React.createContext<PlayerContext>({} as any);

export const RevealInEditorClass = "vid-reveal-in-editor";
