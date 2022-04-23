import { PlayerStore } from "@player/store";
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
  inEditor?: boolean;
  pluginDir?: string;
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
}) => {
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
  inEditor: boolean;
  pluginDir?: string;
}

export const PlayerContext = React.createContext<IPlayerContext>({
  pluginDir: undefined,
  inEditor: false,
});

export { PlayerWarpper as Player };
export type { PlayerStore } from "@player/store";
