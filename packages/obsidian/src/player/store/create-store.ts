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
    devTools: true,
    enhancers: [],
    middleware: (getDefault) =>
      getDefault().concat(createStateSyncMiddleware(msgHandler, allowed)),
  });
  msgHandler.store = store;
  return Object.assign(store, { msgHandler }) as typeof store & {
    msgHandler: typeof msgHandler;
  };
};
