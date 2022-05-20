import createReducer from "@store";
import { withReduxStateSync } from "@store/redux-sync";

import initAPIReducers from "../thunk/youtube";
import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = withReduxStateSync(
    createReducer((builder) => {
      initAPIReducers(builder);
    }),
  );
  return createStoreWithMsgHandler(name, reducer);
};
