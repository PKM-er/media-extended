import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import controlsReducer from "../slice/controls";
import html5Reducer from "../slice/html5";
import interfaceReducer from "../slice/interface";
import providerReducer from "../slice/provider";
import youtubeReducer from "../slice/youtube";

export const store = configureStore({
  reducer: {
    controls: controlsReducer,
    interface: interfaceReducer,
    provider: providerReducer,
    youtube: youtubeReducer,
    html5: html5Reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
