import {
  ActionReducerMapBuilder,
  combineReducers,
  compose,
  createReducer as _createReducer,
} from "@reduxjs/toolkit";

import type { BasicState } from "./basic";
import basic from "./basic";
import { executeReducerBuilderCallback } from "./create-slice";
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
    const reducer: typeof mainReducer = (state, action) => {
      state = mainReducer(state, action);
      state = extraReducer(state, action);
      return state!;
    };
    return reducer;
  } else {
    return mainReducer;
  }
};

export * from "./basic";
export * from "./player";
export { Controls } from "./player/slice/interface";
export { LARGE_CURRENT_TIME } from "./player/slice/status";
export default createReducer;
