import type { CommRemote } from "@/lib/remote-player/type";
import { CommHandler } from "../../comm/handler";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "../const";

declare global {
  // eslint-disable-next-line no-var
  var MX_MESSAGE: Promise<CommRemote>;
}

console.log("running script to recieve port");

const port = new Promise<MessagePort>((resolve, reject) => {
  function onMessage({ data, ports }: MessageEvent<any>) {
    if (data !== PORT_MESSAGE) return;
    resolve(ports[0]);
    console.log("got port");
    window.removeEventListener("message", onMessage);
    window.clearTimeout(timeout);
  }
  window.addEventListener("message", onMessage);
  const timeout = setTimeout(() => {
    reject("failed to get port: timeout " + GET_PORT_TIMEOUT);
    window.removeEventListener("message", onMessage);
  }, GET_PORT_TIMEOUT);
}).then((p) => {
  const handler = new CommHandler() as CommRemote;
  handler.load(p);
  return handler;
});
window.MX_MESSAGE = port;
