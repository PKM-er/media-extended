import {
  BrowserWindow,
  getCurrentWebContents,
  MessageChannelMain,
} from "@electron/remote";
import { initObsidianPort } from "@ipc/comms";
import createChannel from "@ipc/create-channel";
import { PlayerStore } from "@store";
import { join } from "path";

export const createWindow = (store: PlayerStore, pluginDir: string) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      // worldSafeExecuteJavaScript: true,
      // enableRemoteModule: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      spellcheck: true,
      webviewTag: true,
    },
  });

  const sendPort = createChannel(
    getCurrentWebContents(),
    win.webContents,
    MessageChannelMain,
  );
  initObsidianPort(win.webContents.id).then((port) => {
    store.msgHandler.port = port;
  });
  win.loadFile(join(pluginDir, "window", "index.html"));
  win.webContents.once("dom-ready", sendPort);
  win.once("ready-to-show", win.show);
  return win;
};
