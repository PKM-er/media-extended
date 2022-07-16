export {};

declare global {
  var MX_MESSAGE_PORT: Promise<MessagePort>;
}

const GetPortTimeout = 5e3;

const getPortWithTimeout = <T>(
  createHandler: (
    resolve: (value: [port: MessagePort, id?: number | undefined]) => void,
  ) => T,
  registerHandler: (handler: T) => void,
  unregisterHandler: (handler: T) => void,
) =>
  new Promise<[port: MessagePort, id?: number]>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject("failed to get port: timeout");
      unregisterHandler(handler);
    }, GetPortTimeout);

    const resolve_: typeof resolve = (value) => {
      window.clearTimeout(timeout);
      unregisterHandler(handler);
      resolve(value);
    };
    const handler = createHandler(resolve_);
    registerHandler(handler);
  });

console.log("running script to recieve port");
window.MX_MESSAGE_PORT = getPortWithTimeout(
  (resolve) =>
    ({ data, ports }: MessageEvent<any>) => {
      if (data === "port") {
        const [port] = ports;
        resolve([port]);
      }
    },
  (handler) => window.addEventListener("message", handler),
  (handler) => window.removeEventListener("message", handler),
).then(([port]) => {
  console.log("port recieved");
  return port;
});
