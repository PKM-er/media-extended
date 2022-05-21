import { Action, configureStore, Reducer } from "@reduxjs/toolkit";
import {
  createStateSyncMiddleware,
  MessageHandler,
  PlayerStore,
} from "mx-store";

export const createStoreWithMsgHandler = (
  name: string,
  reducer: Reducer,
): PlayerStore => {
  const allowed = undefined;
  const webviewMsg = new MessageHandler(false, allowed);
  const windowMsg = new MessageHandler(false, allowed);
  const store = configureStore({
    reducer,
    devTools: process.env.NODE_ENV !== "production",
    enhancers: [],
    middleware: (getDefault) =>
      getDefault().concat(
        createStateSyncMiddleware(webviewMsg, allowed),
        createStateSyncMiddleware(windowMsg, allowed),
      ),
  }) as PlayerStore;
  webviewMsg.store = store;
  windowMsg.store = store;
  store.webviewMsg = webviewMsg;
  store.windowMsg = windowMsg;
  return store;
};
