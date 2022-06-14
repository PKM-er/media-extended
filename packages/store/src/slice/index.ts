import {
  ActionReducerMapBuilder,
  combineReducers,
  compose,
  createReducer as _createReducer,
} from "@reduxjs/toolkit";
import { executeReducerBuilderCallback } from "@reduxjs/toolkit/dist/mapBuilders";

import type { BasicState } from "./basic";
import basic from "./basic";
import type { PlayerState } from "./player";
import player from "./player";

export interface RootState {
  basic: BasicState;
  player: PlayerState;
}

const createReducer = (
  extra?: (builder: ActionReducerMapBuilder<RootState>) => void,
) => {
  const mainReducer = combineReducers<RootState>({ basic, player });
  // const sharedSliceUpdateReducer =
  if (extra) {
    const extraReducer = _createReducer(
      () => undefined as any,
      ...executeReducerBuilderCallback(extra),
    );
    return compose(
      extraReducer,
      mainReducer, // must be last,
      // since no init state provided to extra reducer
    );
  } else {
    return mainReducer;
  }
};

export * from "./basic";
export * from "./player";
export * from "./player/meta/types";
export * from "./player/source/types";

export default createReducer;
