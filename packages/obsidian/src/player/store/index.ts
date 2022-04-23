import { Action, ThunkAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal/es6";

import type { createStore } from "./ob-store";

export type PlayerStore = ReturnType<typeof createStore>;
export type AppDispatch = PlayerStore["dispatch"];
export type RootState = ReturnType<PlayerStore["getState"]>;
export type AppThunk<
  ReturnType = void,
  ExtraThunkArg = undefined,
> = ThunkAction<ReturnType, RootState, ExtraThunkArg, Action<string>>;

export const observeStore = <T>(
  store: PlayerStore,
  select: (state: RootState) => T,
  onChange: (state: T, prevState: T | undefined) => any,
) => {
  let currentState: { val: T } | undefined;
  const handleChange = () => {
    let nextState = select(store.getState());
    if (!equal(nextState, currentState?.val)) {
      // only trigger on change, not initial
      if (!currentState) {
        currentState = { val: nextState };
      } else {
        onChange(nextState, currentState.val);
        currentState.val = nextState;
      }
    }
  };
  let unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
};

export const getSubscribeFunc =
  <S extends PlayerStore>(store: S) =>
  <T>(
    selector: (state: RootState) => T,
    onChange: (state: T, prevState: T | undefined) => any,
    immediate = false,
  ) =>
    subscribe<T>(store, selector, onChange, immediate);

export const subscribe = <T>(
  store: PlayerStore,
  selector: (state: RootState) => T,
  onChange: (state: T, prevState: T | undefined) => any,
  immediate = false,
) => {
  if (immediate) {
    onChange(selector(store.getState()), undefined);
  }
  return observeStore(store, selector, onChange);
};
