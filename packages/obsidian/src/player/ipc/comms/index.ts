import { ipcRenderer } from "electron";

import { EventEmitter } from "../emitter";
import { getPortWithTimeout } from "./get-port-base";

export const ChannelNameObsidian = "mx-provide-obsidian-channel";
export const ChannelNameBrowserView = "mx-provide-view-channel";

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

export const getObsidianPort = async (viewId: number) =>
    (await getPort(ChannelNameObsidian, viewId))[0],
  getBrowserViewPort = async () => (await getPort(ChannelNameBrowserView))[0];

export const initObsidianPort = (viewId: number) => {
  return new EventEmitter(
    getObsidianPort(viewId).then((port) => {
      console.log("obsidian port ready", port);
      port.onmessageerror = (evt) => {
        console.error("message error on browserview " + viewId, evt.data, evt);
      };
      return port;
    }),
  );
};
