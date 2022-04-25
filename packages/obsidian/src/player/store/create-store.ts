import { createStateSyncMiddleware, MessageHandler } from "@ipc/redux-sync";
import { Action, configureStore, Reducer } from "@reduxjs/toolkit";

export const createStoreWithMsgHandler = <S, A extends Action>(
  name: string,
  reducer: Reducer<S, A>,
) => {
  const allowed = undefined;
  const msgHandler = new MessageHandler(false, allowed);
  const store = configureStore({
    reducer: reducer,
    devTools: process.env.NODE_ENV !== "production",
    enhancers: [],
    middleware: (getDefault) =>
      getDefault().concat(createStateSyncMiddleware(msgHandler, allowed)),
  });
  msgHandler.store = store;
  const storeWithMsg: typeof store & { msgHandler: typeof msgHandler } =
    Object.assign(store, { msgHandler });
  return storeWithMsg;
};
