import { PlayerStore, subscribe } from "@player/store";
import { selectTimestampRequested } from "@slice/action/thunk";

type onTimestamp = (timestamp: number, duration: number) => void;

export const respondTimestampReq = (
  player: HTMLMediaElement,
  store: PlayerStore,
  action: onTimestamp,
) =>
  subscribe(
    store,
    selectTimestampRequested,
    (req) => {
      if (req) {
        action(player.currentTime, player.duration);
      }
    },
    true,
  );

const ID = "mx-timestamp";
export const sendTimestamp = (
  port: MessagePort,
  ...args: Parameters<onTimestamp>
) => {
  port.postMessage([ID, ...args]);
};
export const moniterTimestampMsg = (port: MessagePort, action: onTimestamp) => {
  port.addEventListener("message", ({ data: [id, timestamp, duration] }) => {
    if (id !== ID) return;
    action(timestamp, duration);
  });
};
