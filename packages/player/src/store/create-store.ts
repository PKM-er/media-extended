import { Action, configureStore, Reducer } from "@reduxjs/toolkit";
import {
  createMediaControlMiddleware,
  createStateSyncMiddleware,
  MessageHandler,
  PlayerStore,
  skipMediaControlAction,
} from "mx-store";
import { createNanoEvents } from "nanoevents";

export const createStoreWithMsgHandler = (
  name: string,
  reducer: Reducer,
): PlayerStore => {
  const allowed = undefined,
    webviewMsgHanlder = new MessageHandler(false, allowed),
    emitter = createNanoEvents();
  // windowMsg: new MessageHandler(false, allowed),
  const store = configureStore({
    reducer,
    devTools: process.env.NODE_ENV !== "production",
    enhancers: [],
    middleware: (getDefault) =>
      getDefault().concat(
        createMediaControlMiddleware(emitter),
        createStateSyncMiddleware(webviewMsgHanlder, allowed),
        skipMediaControlAction,
        // createStateSyncMiddleware(extra.windowMsg, allowed),
      ),
  }) as PlayerStore;
  webviewMsgHanlder.store = store;
  // extra.windowMsg.store = store;
  store.emitter = emitter;
  store.webviewMsg = webviewMsgHanlder;
  // Object.assign(store, extra);
  return store;
};
