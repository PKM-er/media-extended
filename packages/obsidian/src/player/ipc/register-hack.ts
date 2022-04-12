import { MAIN_PS } from "@const";
import type MediaExtended from "@plugin";
import { ipcRenderer } from "electron";
import { Platform } from "obsidian";
import { join } from "path";

import { HackWebviewPreload } from "./main-ps/channels";

const registerIPCMain = (plugin: MediaExtended) => {
  if (!Platform.isDesktopApp) return;
  const pluginDir = plugin.getFullPluginDir();
  if (!pluginDir) {
    console.error("plugin dir not available");
    return;
  }
  const pathToInjectScript = join(pluginDir, MAIN_PS);
  try {
    require("@electron/remote").require(pathToInjectScript);
    console.log("main process script injected");
    ipcRenderer.send(HackWebviewPreload);
  } catch (error) {
    console.error("failed to inject main process script: ", error);
  }
};
export default registerIPCMain;
