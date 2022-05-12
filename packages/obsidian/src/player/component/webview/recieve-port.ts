import { getPortWithTimeout } from "@ipc/get-port";

declare global {
  var MX_MESSAGE_PORT: Promise<MessagePort>;
}

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
