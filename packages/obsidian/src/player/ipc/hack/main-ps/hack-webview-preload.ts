import { ipcMain } from "electron";

import {
  HackWebviewPreload,
  MxPreloadScriptUA,
  RevertHackWebviewPreload,
} from "../const";

let registered: Set<number> = new Set();
const handler = (
  _evt: Electron.Event,
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
      console.log("mx: preload script added: ", preloadURL);
    }
  }
};
export const RegisterHackWebviewPreload = () => {
  ipcMain.on(HackWebviewPreload, ({ sender }) => {
    if (registered.has(sender.id)) return;
    console.log("mx: hack webview preload for", sender.id);
    sender.on("will-attach-webview", handler);
    registered.add(sender.id);
  });
  ipcMain.on(RevertHackWebviewPreload, ({ sender }) => {
    if (registered.has(sender.id)) return;
    console.log("mx: revert hack webview preload for", sender.id);
    sender.off("will-attach-webview", handler);
    registered.delete(sender.id);
  });
};
