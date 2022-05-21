import type { ActionState } from "./action";
import type { BiliState } from "./bilibili";
import { ControlledState } from "./controlled";
import type { InterfaceState } from "./interface";
import type { MediaMeta } from "./meta/types";
import { PlayerSource } from "./source/types";
import type { PlayerStatus } from "./status";
import type { UserSeek } from "./user-seek";
import type { YoutubeState } from "./youtube";

type Platform = "safari" | "chromium";
export const setPlatform = createAction<Platform>("setPlatfrom");

export interface RootState {
  platform: Platform | null;
  /**
   * status of current player,
   * obtained via event,
   * cannot be set directly
   */
  status: PlayerStatus;
  /**
   * state that can be set directly to manipulate player
   */
  controlled: ControlledState;
  /**
   * indicate that user is using the progress bar to seek new currentTime,
   * one-way binding to the currentTime of the provider
   * (store -> provider)
   * changing back to null means user seek end and binding is revoked
   */
  userSeek: UserSeek | null;
  /**
   * player source details: urls, ids, etc.
   */
  source: PlayerSource;
  /**
   * metadata about the current media
   */
  meta: MediaMeta;
  /** player UI state */
  interface: InterfaceState;
  /** used to request async actions */
  action: ActionState;
  youtube: YoutubeState;
  bilibili: BiliState;
}

import {
  ActionReducerMapBuilder,
  createAction,
  createReducer as _createReducer,
} from "@reduxjs/toolkit";

import actionSlice from "./action";
import biliSlice from "./bilibili";
import controlledSlice from "./controlled";
import extraReducers from "./extra";
import interfaceSlice from "./interface";
import metaSlice from "./meta";
import sourceSlice from "./source";
import statusSlice from "./status";
import userSeekReducer from "./user-seek";
import youtubeSlice from "./youtube";

const createReducer = (
  extra?: (builder: ActionReducerMapBuilder<RootState>) => void,
) =>
  _createReducer<RootState>(
    {
      platform: null,
      controlled: controlledSlice.initialState,
      status: statusSlice.initialState,
      userSeek: null,
      meta: metaSlice.initialState,
      source: sourceSlice.initialState,
      interface: interfaceSlice.initialState,
      action: actionSlice.initialState,
      youtube: youtubeSlice.initialState,
      bilibili: biliSlice.initialState,
    },
    (builder) => {
      builder.addCase(setPlatform, (state, action) => {
        state.platform = action.payload;
      });
      const reducers = [
        userSeekReducer(),
        controlledSlice.reducers(),
        statusSlice.reducers(),
        interfaceSlice.reducers(),
        actionSlice.reducers(),
        metaSlice.reducers(),
        sourceSlice.reducers(),
        youtubeSlice.reducers(),
        biliSlice.reducers(),
      ];
      const cases = {} as any;
      for (const { addCase } of reducers) {
        addCase.forEach(([typeOrActionCreator, reducer]) => {
          const type =
            typeof typeOrActionCreator === "string"
              ? typeOrActionCreator
              : typeOrActionCreator.type;
          if (type in cases) {
            cases[type].push(reducer);
          } else {
            cases[type] = [reducer];
          }
        });
      }
      for (const type in cases) {
        const reducers = cases[type];
        builder.addCase(type as any, (state, action) => {
          reducers.forEach((reducer: any) => reducer(state, action));
        });
      }
      extra?.(builder);
      extraReducers(builder);
      for (const { addMatcher } of reducers) {
        addMatcher.forEach(([matcher, reducer]) =>
          builder.addMatcher(matcher as any, reducer),
        );
      }
    },
  );

export default createReducer;
