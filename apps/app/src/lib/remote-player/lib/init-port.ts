import type { MsgCtrlRemote } from "@/lib/remote-player/interface";
import { MessageController } from "../../message";
import { GET_PORT_TIMEOUT, PORT_MESSAGE } from "../const";

export default async function initPort() {
  console.log("running script to recieve port");
  const port = await new Promise<MessagePort>((resolve, reject) => {
    function onMessage({ data, ports }: MessageEvent<any>) {
      console.log("got message", data, ports);
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
  });
  const handler = new MessageController() as MsgCtrlRemote;
  handler.load(port);
  return handler;
}
