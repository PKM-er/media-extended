import { ipcMain, MessageChannelMain, webContents } from "electron";

import { CreateChannel } from "../const";
import createChannel from "../create-channel";

const RegisterCreateChannel = () => {
  ipcMain.on(CreateChannel, ({ sender }, viewId: number) => {
    const view = webContents.fromId(viewId);
    const sendChannelToView = createChannel(sender, view, MessageChannelMain);
    view.once("dom-ready", sendChannelToView);
  });
};
export default RegisterCreateChannel;
