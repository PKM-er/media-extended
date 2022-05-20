const GetPortTimeout = 5e3;

export const getPortWithTimeout = <T>(
  getHandler: (
    resolve: (value: [port: MessagePort, id?: number | undefined]) => void,
  ) => T,
  on: (handler: T) => void,
  off: (handler: T) => void,
) =>
  new Promise<[port: MessagePort, id?: number]>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject("failed to get port: timeout");
      off(handler);
    }, GetPortTimeout);

    const resolve_: typeof resolve = (value) => {
      window.clearTimeout(timeout);
      off(handler);
      resolve(value);
    };
    const handler = getHandler(resolve_);
    on(handler);
  });
