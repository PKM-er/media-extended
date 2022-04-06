import controlsReducer from "@player/slice/controls";
import html5Reducer from "@player/slice/html5";
import interfaceReducer from "@player/slice/interface";
import providerReducer from "@player/slice/provider";
import youtubeReducer from "@player/slice/youtube";
import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

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
