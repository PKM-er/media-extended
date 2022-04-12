import { BrowserWindow, ipcMain } from "electron";

import { DisableInput } from "./channels";

export const RegisterDisableViewInput = () => {
  ipcMain.handle(DisableInput, ({ sender }, viewId) => {
    const win = BrowserWindow.fromWebContents(sender);
    if (!win) return false;
    const view = win
      .getBrowserViews()
      .find((view) => view.webContents.id === viewId);
    if (!view) return false;
    view.webContents.on("before-input-event", (evt, input) => {
      evt.preventDefault();
      win.webContents.focus();
      const inputevt = {
        keyCode: input.code,
        modifiers: input.modifiers as Electron.InputEvent["modifiers"],
      } as const;
      // pass key press back to obsidian
      win.webContents.sendInputEvent({ ...inputevt, type: "keyDown" });
      win.webContents.sendInputEvent({ ...inputevt, type: "keyUp" });
    });
    return true;
  });
};
