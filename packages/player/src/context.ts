import { AppDispatch } from "mx-store";
import { createContext } from "react";

import { ScreenshotArgs } from "./hook-player/screenshot";
import { TimestampArgs } from "./hook-player/timestamp";

export interface IPlayerContext {
  inEditor?: boolean;
  actions: IActions;
  getUserScriptFor(url: string): Promise<{ css?: string; js: string } | null>;
}

export interface IActions {
  gotScreenshot: (dispatch: AppDispatch, args: ScreenshotArgs) => any;
  gotTimestamp: (dispatch: AppDispatch, args: TimestampArgs) => any;
}

export const PlayerContext = createContext<IPlayerContext>({} as any);
