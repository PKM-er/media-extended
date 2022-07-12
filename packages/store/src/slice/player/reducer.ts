import { produce } from "immer";
import { AnyAction } from "redux";

import actionReducer from "./slice/action";
import { Controls, initialInterface } from "./slice/interface";
import interfaceReducer from "./slice/interface";
import { isInitAction } from "./slice/source";
import initReducer from "./slice/source/set-source";
import updateSourceReducer from "./slice/source/update-source";
import basicStatusReducer from "./slice/status/basic";
import biliStatusReducer from "./slice/status/bilibili";
import ytStatusReducer from "./slice/status/youtube";
import userSeekReducer from "./slice/user-seek";
import { PlayerState } from "./typings";
import { isHTMLMediaState, PlayerType } from "./typings";
import { NoMediaState } from "./typings";

const initialState: NoMediaState = {
  type: null,
  source: null,
  meta: null,
  status: null,
  userSeek: null,
  interface: initialInterface,
  action: {
    getScreenshot: null,
    getTimestamp: false,
  },
};

const playerReducer = (
  state: PlayerState = initialState,
  action: AnyAction,
): PlayerState =>
  produce(state, (state) => {
    actionReducer(state.action, action);
    interfaceReducer(state.interface, action);
    if (state.type === null) {
      if (isInitAction(action)) {
        initReducer(state, action);
      }
    } else {
      initReducer(state, action);
      userSeekReducer(state, action);
      basicStatusReducer(state.status, action);

      if (isHTMLMediaState(state)) {
        updateSourceReducer(state, action);
      } else if (state.type === PlayerType.bilibili) {
        biliStatusReducer(state.status, action);
      } else if (state.type === PlayerType.youtubeAPI) {
        ytStatusReducer(state.status, action);
      }
    }
  });

export default playerReducer;
