import createReducer from "mx-store";
import { withReduxStateSync } from "mx-store";

import { fetchMetaReducers } from "../thunk/fetch-meta";
import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = withReduxStateSync(
    createReducer((builder) => (fetchMetaReducers(builder), void 0)),
  );
  return createStoreWithMsgHandler(name, reducer);
};
