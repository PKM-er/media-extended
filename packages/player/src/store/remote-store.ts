import createReducer from "mx-store";
import { withReduxStateSync } from "mx-store";

import { fetchMetaReducers } from "../thunk/fetch-meta";
import { initYoutubeAPIReducers } from "../thunk/youtube-api";
import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = withReduxStateSync(
    createReducer(
      (builder) => (
        initYoutubeAPIReducers(builder), fetchMetaReducers(builder), void 0
      ),
    ),
  );
  return createStoreWithMsgHandler(name, reducer);
};
