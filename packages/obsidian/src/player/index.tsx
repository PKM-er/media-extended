import { createStore } from "@player/store";
import React from "react";
import { Provider } from "react-redux";

import Player from "./player";

const PlayerWarpper = ({
  store,
  inEditor = false,
  ...context
}: {
  store: ReturnType<typeof createStore>;
  inEditor?: boolean;
  pluginDir?: string;
}) => {
  return (
    <React.StrictMode>
      <PlayerContext.Provider value={{ inEditor, ...context }}>
        <Provider store={store}>
          <Player />
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

export { createStore, PlayerWarpper as Player };
export type { PlayerStore } from "@player/store";
