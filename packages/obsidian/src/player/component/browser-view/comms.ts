import { ipcRenderer } from "electron";

export const ChannelNameObsidian = "mx-provide-obsidian-channel";
export const ChannelNameBrowserView = "mx-provide-view-channel";

const GetPortTimeout = 5e3;

const getPort = (channel: string, viewId?: number) =>
  new Promise<[port: MessagePort, id?: number]>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject("failed to get port: timeout");
      ipcRenderer.off(channel, handler);
    }, GetPortTimeout);

    const handler = (evt: Electron.IpcRendererEvent, id?: number) => {
      // if no viewId given (browserview port) or id matches (obsidian port)
      if (viewId === undefined || id === viewId) {
        const [port] = evt.ports;
        window.clearTimeout(timeout);
        ipcRenderer.off(channel, handler);
        return resolve([port, id]);
      }
    };
    ipcRenderer.on(channel, handler);
  });

export const getObsidianPort = async <
    MView extends Message,
    MOb extends Message,
  >(
    viewId: number,
  ) =>
    (await getPort(ChannelNameObsidian, viewId))[0] as IMessagePort<MView, MOb>,
  getBrowserViewPort = async <MView extends Message, MOb extends Message>() =>
    (await getPort(ChannelNameBrowserView))[0] as IMessagePort<MOb, MView>;

export interface Message {
  event: string;
  data?: any;
}

export interface IMessagePort<
  MIn extends Message = Message,
  MOut extends Message = Message,
> extends Omit<MessagePort, "addEventListener" | "removeEventListener"> {
  postMessage(message: MOut): void;
  onmessage: (evt: MessageEvent<MIn>) => void;
  addEventListener(
    type: "message",
    listener: (this: MessagePort, ev: MessageEvent<MIn>) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "message",
    listener: (this: MessagePort, ev: MessageEvent<MIn>) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface IBrowserViewAPI<MOut extends Message, MIn extends Message> {
  portReady(): boolean;
  dispatch(message: MOut): void;
  on<M extends MIn>(
    event: M["event"],
    handler: (data?: M["data"]) => any,
  ): void;
  offref(id: number): boolean;
}
