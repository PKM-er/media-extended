// https://github.com/aohua/redux-state-sync/blob/a34bb4793e1f4969d597c0a59abd2dd187d1e356/src/syncState.js

import type { AnyAction, Middleware, Reducer, Store } from "@reduxjs/toolkit";

import {
  GOT_INIT_STATE,
  GotInitStateAction,
  REQ_INIT_STATE,
  requsetInitState,
  SEND_INIT_STATE,
  StampedAction,
} from "./actions";
import MessageHandler from "./msg-handler";

export const isActionAllowed = ({
  predicate,
  blacklist,
  whitelist,
}: {
  predicate?: (action: AnyAction) => boolean;
  blacklist?: string[];
  whitelist?: string[];
}): ((action: StampedAction) => boolean) => {
  let allowed: (action: StampedAction) => boolean = () => true;

  if (predicate) {
    allowed = predicate;
  } else if (blacklist) {
    allowed = (action) => blacklist.indexOf(action.type) < 0;
  } else if (whitelist) {
    allowed = (action) => whitelist.indexOf(action.type) >= 0;
  }
  return allowed;
};

export const isActionRemote = (action: AnyAction) =>
  !!(action as StampedAction).$fromRemote;

export const createStateSyncMiddleware =
  (
    msgHandler: MessageHandler,
    allowed?: (action: AnyAction) => boolean,
  ): Middleware =>
  ({ getState }) =>
  (next) =>
  (action) => {
    if (action) {
      switch (action.type) {
        case SEND_INIT_STATE:
          let state = getState();
          state && msgHandler.sendInitState(state);
        case GOT_INIT_STATE:
          // dispatched by onmessage
          // handled only by reducer warpper
          break;
        case REQ_INIT_STATE:
          msgHandler.requsetInitState();
          break;
        default:
          if (
            !(action as StampedAction).$fromRemote &&
            (!allowed || allowed(action))
          )
            msgHandler.syncAction(action);
          break;
      }
    }
    return next(action);
  };

export const withReduxStateSync =
  <S>(appReducer: Reducer<S>): Reducer<S> =>
  (state, action) => {
    let initState = state;
    if (action.type === GOT_INIT_STATE) {
      initState = (action as GotInitStateAction).payload;
    }
    return appReducer(initState, action);
  };

export const initStateFromHost = <S extends Store>({ dispatch }: S) => {
  dispatch(requsetInitState());
};

export { default as MessageHandler } from "./msg-handler";
