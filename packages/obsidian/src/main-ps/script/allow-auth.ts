import { app, ipcMain } from "electron";

import { AllowAuth, Auth, ClearAuth, RevertAllowAuth, SetAuth } from "../const";

type LoginHandler = (
  event: Electron.Event,
  webContents: Electron.WebContents,
  authenticationResponseDetails: Electron.AuthenticationResponseDetails,
  authInfo: Electron.AuthInfo,
  callback: (username?: string, password?: string) => void,
) => void;

const handler: LoginHandler = (
  evt,
  webContents,
  { url },
  _authInfo,
  callback,
) => {
  for (const [pattern, [username, password]] of registered[webContents.id]) {
    if (new RegExp(pattern).test(url)) {
      console.log("pattern matched: ", pattern, url);
      evt.preventDefault();
      callback(username, password);
      return;
    }
  }
};

let registered: Record<number, Map<string, Auth>> = {};

export const RegisterAllowAuth = () => {
  ipcMain.on(AllowAuth, ({ sender }) => {
    if (registered[sender.id]) return;
    console.log("mx: allow auth for", sender.id);
    app.on("login", handler);
    if (!registered[sender.id]) registered[sender.id] = new Map();
  });
  ipcMain.on(SetAuth, ({ sender }, record) => {
    if (!registered[sender.id])
      registered[sender.id] = new Map(Object.entries<Auth>(record));
    else
      for (const [pattern, auth] of Object.entries<Auth>(record)) {
        registered[sender.id].set(pattern, auth);
      }
    console.log("mx: auth set for", sender.id);
  });
  ipcMain.on(ClearAuth, ({ sender }) => {
    if (!registered[sender.id]) registered[sender.id] = new Map();
    else registered[sender.id].clear();
    console.log("mx: auth cleared for", sender.id);
  });
  ipcMain.on(RevertAllowAuth, ({ sender }) => {
    if (!registered[sender.id]) return;
    console.log("mx: cancel allow auth for", sender.id);
    app.off("login", handler);
    delete registered[sender.id];
  });
};
