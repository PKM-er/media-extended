import {
  createStoreWithMsgHandler,
  fetchMetaReducers,
  initYoutubeAPIReducers,
} from "mx-player";
import createReducer, { setInitInfo } from "mx-store";
import { Platform } from "obsidian";

export const createStore = (name: string) => {
  const reducer = createReducer((builder) => {
    fetchMetaReducers(builder);
    initYoutubeAPIReducers(builder);
  });
  const store = createStoreWithMsgHandler(name, reducer);
  store.dispatch(
    setInitInfo({
      platform: Platform.isSafari ? "safari" : "chromium",
      lang: localStorage.language || "en",
    }),
  );
  return store;
};
