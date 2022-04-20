import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import actionReducer from "@slice/action";
import controlsReducer from "@slice/controls";
import html5Reducer from "@slice/html5";
import interfaceReducer from "@slice/interface";
import providerReducer from "@slice/provider";
import youtubeReducer from "@slice/youtube";

export const createStore = (name: string) =>
  configureStore({
    reducer: {
      controls: controlsReducer,
      interface: interfaceReducer,
      provider: providerReducer,
      youtube: youtubeReducer,
      html5: html5Reducer,
      action: actionReducer,
    },
    devTools: true,
    enhancers: [],
  });

export type PlayerStore = ReturnType<typeof createStore>;
export type AppDispatch = PlayerStore["dispatch"];
export type RootState = ReturnType<PlayerStore["getState"]>;
export type AppThunk<
  ReturnType = void,
  ExtraThunkArg = undefined,
> = ThunkAction<ReturnType, RootState, ExtraThunkArg, Action<string>>;