import { store } from "@player/store";
import React from "react";
import { Provider } from "react-redux";

import Player from "./player";

const PlayerTest = () => (
  <React.StrictMode>
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <Player />
        </header>
      </div>
    </Provider>
  </React.StrictMode>
);
export default PlayerTest;
