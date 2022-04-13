import { ipcMain } from "electron";

import { HackWebviewPreload, MxPreloadScriptUA } from "../const";

let registered: Set<number> = new Set();
export const RegisterHackWebviewPreload = () => {
  const handler = (
    evt: Electron.Event,
    pref: Electron.WebPreferences,
    params: Record<string, string>,
  ) => {
    if (params.preload) {
      let preloadURL = params.preload;
      // simple gatekeeper to prevent malicious preload scripts
      if (
        typeof preloadURL === "string" &&
        params.useragent?.startsWith(MxPreloadScriptUA)
      ) {
        (pref as any).preloadURL = preloadURL;
        params.useragent = params.useragent.substring(MxPreloadScriptUA.length);
        console.log("mx: preload script added", pref);
      }
    }
  };
  ipcMain.on(HackWebviewPreload, ({ sender }) => {
    if (registered.has(sender.id)) return;
    sender.on("will-attach-webview", handler);
    registered.add(sender.id);
  });
};
