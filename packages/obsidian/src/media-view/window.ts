import {
  BrowserWindow,
  getCurrentWebContents,
  MessageChannelMain,
} from "@electron/remote";
import { initObsidianPort } from "@ipc/comms";
import createChannel from "@ipc/create-channel";
import {
  handleBiliInjectCodeReq,
  moniterScreenshotMsg,
  moniterTimestampMsg,
} from "mx-player";
import { PlayerStore } from "mx-store";
import { join } from "path";

import type MediaExtended from "../mx-main";
import { gotScreenshot, gotTimestamp } from "../player";

export const createWindow = (store: PlayerStore, plugin: MediaExtended) => {
  const pluginDir = plugin.getFullPluginDir();
  if (!pluginDir)
    throw new Error(
      "Failed to create media view window: plugin dir not available",
    );
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
    store.windowMsg.port = port;
    moniterScreenshotMsg(port, (...args) =>
      store.dispatch(gotScreenshot(...args)),
    );
    moniterTimestampMsg(port, (...args) =>
      store.dispatch(gotTimestamp(...args)),
    );
    handleBiliInjectCodeReq(port, () => plugin.BilibiliInjectCode);
  });
  win.loadURL("app://local" + join(pluginDir, "window", "index.html"));
  win.webContents.once("dom-ready", sendPort);
  win.once("ready-to-show", win.show);
  return win;
};
