import { createStore } from "@player/store";
import React from "react";
import { Provider } from "react-redux";

import Player from "./player";

const PlayerWarpper = ({
  store,
}: {
  store: ReturnType<typeof createStore>;
}) => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <Player />
      </Provider>
    </React.StrictMode>
  );
};

export { createStore, PlayerWarpper as Player };
export type { PlayerStore } from "@player/store";
