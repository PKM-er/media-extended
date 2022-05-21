import "./style/index-win.less";

import { getWebViewPort } from "@ipc/comms";
import { Player } from "mx-player";
import { createRemoteStore, sendScreenshot, sendTimestamp } from "mx-player";
import { initStateFromHost } from "mx-store";
import React from "react";
import ReactDOM from "react-dom";

console.log("running script to recieve port");

const store = createRemoteStore(window.location.href);

getWebViewPort().then((port) => {
  console.log("port recieved");
  store.msgHandler.port = port;
  initStateFromHost(store);
});

ReactDOM.render(
  <Player
    store={store}
    actions={{
      gotScreenshot: (_dispatch, args) => {
        sendScreenshot(store.msgHandler.port!, ...args);
      },
      gotTimestamp: (_dispatch, args) => {
        sendTimestamp(store.msgHandler.port!, ...args);
      },
    }}
    getBiliInjectCode={async () => void 0}
  />,
  document.getElementById("root")!,
);
