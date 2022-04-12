import { ipcMain } from "electron";

import { HackWebviewPreload } from "./channels";

let registered: Set<number> = new Set();
export const RegisterHackWebviewPreload = () => {
  const handler = (
    evt: Electron.Event,
    pref: Electron.WebPreferences,
    params: Record<string, string>,
  ) => {
    if (params.preload) {
      let preloadURL = params.preload;
      (pref as any).preloadURL = preloadURL;
      console.log("mx: preload script added", pref);
    }
  };
  ipcMain.on(HackWebviewPreload, ({ sender }) => {
    if (registered.has(sender.id)) return;
    sender.on("will-attach-webview", handler);
    registered.add(sender.id);
  });
};
