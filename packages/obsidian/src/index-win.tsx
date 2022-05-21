import "./style/index-win.less";

import { getWebViewPort } from "@ipc/comms";
import { getBiliInjectCode as _getBili, Player } from "mx-player";
import { createRemoteStore, sendScreenshot, sendTimestamp } from "mx-player";
import { initStateFromHost } from "mx-store";
import React from "react";
import ReactDOM from "react-dom";

console.log("running script to recieve port");

const store = createRemoteStore(window.location.href);

getWebViewPort().then((port) => {
  console.log("port recieved");
  store.windowMsg.port = port;
  initStateFromHost(store);
  let biliCode: ReturnType<typeof _getBili> | undefined;
  const getBiliInjectCode = () => {
    if (biliCode) return biliCode;
    return (biliCode = _getBili(port));
  };
  ReactDOM.render(
    <Player
      store={store}
      actions={{
        gotScreenshot: (_dispatch, args) => {
          sendScreenshot(port, ...args);
        },
        gotTimestamp: (_dispatch, args) => {
          sendTimestamp(port, ...args);
        },
      }}
      getBiliInjectCode={getBiliInjectCode}
    />,
    document.getElementById("root")!,
  );
});
