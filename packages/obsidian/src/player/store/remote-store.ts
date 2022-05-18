import createReducer from "@store";
import { withReduxStateSync } from "@store/redux-sync";

import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = withReduxStateSync(createReducer());
  return createStoreWithMsgHandler(name, reducer);
};
