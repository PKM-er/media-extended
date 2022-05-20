import { BrowserWindow, ipcMain, webContents } from "electron";
import { debounce } from "lodash-es";

import { DisableInput } from "../const";

export const RegisterDisableViewInput = () => {
  ipcMain.handle(DisableInput, ({ sender }, viewId) => {
    const win = BrowserWindow.fromWebContents(sender);
    if (!win) return false;
    const view = webContents.fromId(viewId);
    if (!view) return false;

    // TODO: handle auto repeat and debounced keyup
    view.on("before-input-event", (evt, input) => {
      evt.preventDefault();
      win.webContents.focus();
      console.log(input.isAutoRepeat);
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
