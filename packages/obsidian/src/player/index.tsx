import type MediaExtended from "@plugin";
import { PlayerStore } from "@store";
import React from "react";
import { Provider } from "react-redux";

import Player from "./player";

const PlayerWarpper = ({
  store,
  inEditor = false,
  onFocus,
  onBlur,
  ...context
}: {
  store: PlayerStore;
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
} & IPlayerContext) => {
  return (
    <React.StrictMode>
      <PlayerContext.Provider value={{ inEditor, ...context }}>
        <Provider store={store}>
          <Player onFocus={onFocus} onBlur={onBlur} />
        </Provider>
      </PlayerContext.Provider>
    </React.StrictMode>
  );
};

interface IPlayerContext {
  inEditor?: boolean;
  plugin: MediaExtended;
}

export const PlayerContext = React.createContext<IPlayerContext>({} as any);

export { PlayerWarpper as Player };
export type { PlayerStore } from "@store";
