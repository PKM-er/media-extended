import { MAIN_PS } from "@const";
import type MediaExtended from "@plugin";
import { ipcRenderer } from "electron";
import { Platform } from "obsidian";
import { join } from "path";

import { AllowAuth, RevertAllowAuth } from "./const";

const noop = () => {};
const registerIPCMain = (plugin: MediaExtended): (() => void) => {
  if (!Platform.isDesktopApp) return noop;
  const pluginDir = plugin.getFullPluginDir();
  if (!pluginDir) {
    console.error("plugin dir not available");
    return noop;
  }
  const pathToInjectScript = join(pluginDir, MAIN_PS);
  try {
    require("@electron/remote").require(pathToInjectScript);
    console.log("main process script injected");
    // ipcRenderer.send(HackWebviewPreload);
    ipcRenderer.send(AllowAuth);
    return () => {
      // ipcRenderer.send(RevertHackWebviewPreload);
      ipcRenderer.send(RevertAllowAuth);
    };
  } catch (error) {
    console.error("failed to inject main process script: ", error);
    return noop;
  }
};
export default registerIPCMain;
