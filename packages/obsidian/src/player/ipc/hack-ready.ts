import { Platform } from "obsidian";

import { MxScriptRegistered } from "./main-ps/channels";

export const checkIfHackReady = async (): Promise<boolean | null> => {
  if (!Platform.isDesktopApp) return null;
  try {
    await require("electron").ipcRenderer.invoke(MxScriptRegistered);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("No handler registered for")
    ) {
      return false;
    } else {
      throw error;
    }
  }
};

export const onHackReady = (action: () => void) => {
  let hackReadyRecieved = false;

  const { ipcRenderer } = require("electron");

  const timeout = window.setTimeout(() => {
    console.error("timeout: main process script not available");
    ipcRenderer.off(MxScriptRegistered, handler);
  }, 5e3);
  const handler = () => {
    hackReadyRecieved = true;
    window.clearTimeout(timeout);
    action();
  };
  ipcRenderer.once(MxScriptRegistered, handler);
  checkIfHackReady().then((isHackReady) => {
    // if hackReady is broadcasted, do nothing
    if (hackReadyRecieved) return;
    if (isHackReady === true) {
      ipcRenderer.off(MxScriptRegistered, handler);
      window.clearTimeout(timeout);
      action();
    } else if (isHackReady === false) {
      // continue to wait for broadcast
    } else {
      throw new Error("electron hack not available in non-desktop environment");
    }
  });
};
