import { ipcRenderer } from "electron";

import { ChannelNameBrowserView, ChannelNameObsidian } from "./create-channel";
import { getPortWithTimeout } from "./get-port";

const getPort = (channel: string, viewId?: number) =>
  getPortWithTimeout(
    (resolve) => (evt: Electron.IpcRendererEvent, id?: number) => {
      // if no viewId given (browserview port) or id matches (obsidian port)
      if (viewId === undefined || id === viewId) {
        const [port] = evt.ports;
        resolve([port, id]);
      }
    },
    (handler) => ipcRenderer.on(channel, handler),
    (handler) => ipcRenderer.off(channel, handler),
  );

const getObsidianPort = async (viewId: number) =>
  (await getPort(ChannelNameObsidian, viewId))[0];
export const getWebViewPort = async () =>
  (await getPort(ChannelNameBrowserView))[0];

export const initObsidianPort = (viewId: number) =>
  getObsidianPort(viewId).then((port) => {
    console.log("obsidian port ready", port);
    port.onmessageerror = (evt) => {
      console.error("message error on browserview " + viewId, evt.data, evt);
    };
    return port;
  });
