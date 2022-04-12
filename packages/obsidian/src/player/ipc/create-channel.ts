import { getCurrentWebContents, MessageChannelMain } from "@electron/remote";

import { ChannelNameBrowserView, ChannelNameObsidian } from "./comms";

/**
 * @returns function to send port to browser view
 */
const createChannel = (view: Electron.BrowserView): (() => void) => {
  const webContents = getCurrentWebContents();
  const { port1: portOb, port2: portView } = new MessageChannelMain();
  webContents.postMessage(ChannelNameObsidian, view.webContents.id, [portOb]);
  return () =>
    view.webContents.postMessage(ChannelNameBrowserView, null, [portView]);
};

export default createChannel;
