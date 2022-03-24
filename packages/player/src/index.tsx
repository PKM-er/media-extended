import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { store } from "./app/store";
import Player from "./player";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <Player />
        </header>
      </div>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
