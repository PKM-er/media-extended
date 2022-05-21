import "./style/index-win.less";

import { getWebViewPort } from "@ipc/comms";
import { Player } from "@player";
import { createStore } from "@player/store/window-store";
import { getSubscribeFunc } from "mx-store";
import { initStateFromHost } from "mx-store";
import React from "react";
import ReactDOM from "react-dom";

console.log("running script to recieve port");

const store = createStore(window.location.href);

getWebViewPort().then((port) => {
  console.log("port recieved");
  store.msgHandler.port = port;
  initStateFromHost(store);
});

ReactDOM.render(<Player store={store} />, document.getElementById("root")!);
