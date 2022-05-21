import createReducer from "mx-store";
import { withReduxStateSync } from "mx-store";

import { createStoreWithMsgHandler } from "./create-store";

export const createStore = (name: string) => {
  const reducer = withReduxStateSync(createReducer());
  return createStoreWithMsgHandler(name, reducer);
};
