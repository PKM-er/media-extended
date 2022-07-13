//#region  types
import {
  Action,
  AnyAction,
  EnhancedStore,
  ThunkAction,
} from "@reduxjs/toolkit";
import { Emitter } from "nanoevents";

import type { MessageHandler } from "./redux-sync";
import { RootState } from "./slice";

type EvtEmitter = Emitter<EventMap>;

export type PlayerStore = EnhancedStore<
  RootState,
  AnyAction,
  [ThunkMiddleware<RootState, AnyAction, EvtEmitter>]
> &
  Record<"webviewMsg" | "windowMsg", MessageHandler> & {
    emitter: EvtEmitter;
  };
export type AppDispatch = PlayerStore["dispatch"];

export type AppThunk<
  ReturnType = void,
  ExtraThunkArg = EvtEmitter,
> = ThunkAction<ReturnType, RootState, ExtraThunkArg, Action<string>>;
//#endregion

import equal from "fast-deep-equal/es6";
import type { ThunkMiddleware } from "redux-thunk";

import { EventMap } from "./slice/player/direct-exec";

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
