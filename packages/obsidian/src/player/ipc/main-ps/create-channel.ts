import { ipcMain, MessageChannelMain, webContents } from "electron";

import { ChannelNameBrowserView, ChannelNameObsidian } from "../comms";
import { CreateChannel } from "./channels";

const RegisterCreateChannel = () => {
  ipcMain.on(CreateChannel, ({ sender }, viewId: number) => {
    const { port1: portOb, port2: portView } = new MessageChannelMain();
    sender.postMessage(ChannelNameObsidian, viewId, [portOb]);
    const view = webContents.fromId(viewId);
    view.once("dom-ready", () =>
      view.postMessage(ChannelNameBrowserView, null, [portView]),
    );
  });
};
export default RegisterCreateChannel;
