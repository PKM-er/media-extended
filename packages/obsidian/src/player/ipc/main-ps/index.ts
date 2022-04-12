import { BrowserWindow, ipcMain } from "electron";

import { MxScriptRegistered } from "./channels";
import RegisterCreateChannel from "./create-channel";
import { RegisterDisableViewInput } from "./disable-view-input";
import { RegisterHackWebviewPreload } from "./hack-webview-preload";

console.log("hello from media extended inject script");

declare global {
  var __MX_REGISTERED__: true | undefined;
}

const register = () => {
  if (!globalThis.__MX_REGISTERED__) {
    RegisterDisableViewInput();
    RegisterCreateChannel();
    RegisterHackWebviewPreload();

    // method to check if registered
    ipcMain.handle(MxScriptRegistered, () => true);
    // broadcast that script is registered
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(MxScriptRegistered);
    }
    globalThis.__MX_REGISTERED__ = true;
    console.log("media extended ipc handler registered");
    return true;
  } else {
    console.log("media extended already registered");
    return false;
  }
};

// export register result
export default register();
