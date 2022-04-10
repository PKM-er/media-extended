import {
  getBrowserViewPort,
  IBrowserViewAPI,
  IMessagePort,
  Message,
} from "./comms";

const PreloadSetup = <MIn extends Message, MOut extends Message>(
  injectCode: string,
): IBrowserViewAPI<MOut, MIn> => {
  console.log("running preload script");

  let port: IMessagePort<MIn, MOut> | undefined;
  getBrowserViewPort<MOut, MIn>().then((port_) => {
    console.log("browser view port ready");
    port = port_;
  });

  let eventHandleRefs: ([event: string, handler: Function] | undefined)[] = [];

  const isPortNotReady = (_p: typeof port): _p is undefined => {
    if (_p) return false;
    else throw new Error("port not ready");
  };

  window.addEventListener("DOMContentLoaded", () => {
    const scriptEl = document.createElement("script");
    scriptEl.textContent = injectCode;
    document.head.append(scriptEl);
  });
  return {
    portReady: () => !!port,
    dispatch: (message) => {
      if (isPortNotReady(port)) return;
      port.postMessage(message);
    },
    on: (event, handler) => {
      if (isPortNotReady(port)) return;
      const _handler = ({ data }: MessageEvent<MIn>) => handler(data);
      port.addEventListener("message", _handler);
      return eventHandleRefs.push([event, _handler]) - 1;
    },
    offref: (id) => {
      if (isPortNotReady(port)) return false;
      if (id < 0 || id >= eventHandleRefs.length) return false;
      const ref = eventHandleRefs[id];
      if (ref) {
        // @ts-expect-error
        port.removeEventListener(...ref);
        eventHandleRefs[id] = undefined;
        return true;
      } else {
        return false;
      }
    },
  };
};
export default PreloadSetup;
