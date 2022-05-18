//#region  types
import {
  Action,
  AnyAction,
  EnhancedStore,
  ThunkAction,
} from "@reduxjs/toolkit";

import type { MessageHandler } from "./redux-sync";
import { RootState } from "./slice";

export type PlayerStore = EnhancedStore<
  RootState,
  AnyAction,
  [ThunkMiddleware<RootState, AnyAction, undefined>]
> & {
  msgHandler: MessageHandler;
};
export type AppDispatch = PlayerStore["dispatch"];

export type AppThunk<
  ReturnType = void,
  ExtraThunkArg = undefined,
> = ThunkAction<ReturnType, RootState, ExtraThunkArg, Action<string>>;
//#endregion

import equal from "fast-deep-equal/es6";
import { ThunkMiddleware } from "redux-thunk";

export const observeStore = <T>(
  store: PlayerStore,
  select: (state: RootState) => T,
  onChange: (state: T, prevState: T | undefined) => any,
) => {
  let currentState = select(store.getState());
  const handleChange = () => {
    let nextState = select(store.getState());
    if (!equal(nextState, currentState)) {
      // only trigger on change, not initial
      const args: [now: T, prev: T] = [nextState, currentState];
      currentState = nextState;
      onChange(...args);
    }
  };
  return store.subscribe(handleChange);
};

export const getSubscribeFunc =
  <S extends PlayerStore = PlayerStore>(store: S) =>
  <T>(
    selector: (state: RootState) => T,
    onChange: (state: T, prevState: T | undefined) => any,
    immediate = true,
  ) =>
    subscribe<T>(store, selector, onChange, immediate);

export const subscribe = <T>(
  store: PlayerStore,
  selector: (state: RootState) => T,
  onChange: (state: T, prevState: T | undefined) => any,
  immediate = true,
) => {
  if (immediate) {
    onChange(selector(store.getState()), undefined);
  }
  return observeStore(store, selector, onChange);
};
