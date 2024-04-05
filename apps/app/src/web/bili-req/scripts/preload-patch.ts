import { ipcMain } from "electron";
import { channelId } from "../channel";
import { storeId } from "./store-id";
const channels = channelId(storeId);
let preloadHandler:
  | ((
      event: { preventDefault: () => void; readonly defaultPrevented: boolean },
      webPreferences: Electron.WebPreferences,
      params: Record<string, string>,
    ) => void)
  | null = null;

ipcMain.handle(channels.enable, ({ sender }, script: string) => {
  preloadHandler = (_evt, pref, params) => {
    console.log("preloadHandler", params.preload, channels.preload);
    if (params.preload !== channels.preload) return;
    pref.preload = script;
  };
  sender.on("will-attach-webview", preloadHandler);
  console.log("bili-req preload handler enabled");
});
ipcMain.handle(channels.disable, ({ sender }) => {
  preloadHandler && sender.off("will-attach-webview", preloadHandler);
  ipcMain.removeHandler(channels.enable);
  ipcMain.removeHandler(channels.disable);
  console.log("bili-req preload handler unloaded");
});

console.log("bili-req preload handler loaded");
