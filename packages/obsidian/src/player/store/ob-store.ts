import createReducer, { setPlatform } from "@store";
import { Platform } from "obsidian";

import fetchMetaReducers from "../thunk/fetch-meta";
import initAPIReducers from "../thunk/youtube";
import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = createReducer((builder) => {
    fetchMetaReducers(builder);
    initAPIReducers(builder);
  });
  const store = createStoreWithMsgHandler(name, reducer);
  store.dispatch(setPlatform(Platform.isSafari ? "safari" : "chromium"));
  return store;
};
