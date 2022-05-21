import { Media } from "mx-base";
import { PlayerStore, selectTimestampRequested, subscribe } from "mx-store";

type onTimestamp = (...args: TimestampArgs) => void;
export type TimestampArgs = [timestamp: number, duration: number];
export const respondTimestampReq = (
  media: Media,
  store: PlayerStore,
  action: onTimestamp,
  getDuration?: () => number | null,
) =>
  subscribe(store, selectTimestampRequested, (req) => {
    if (req) {
      action(media.currentTime, getDuration?.() ?? media.duration);
    }
  });

export const TimestampMsgID = "mx-timestamp";
export type TimestampMsg = [typeof TimestampMsgID, ...Parameters<onTimestamp>];

export const sendTimestamp = (
  port: MessagePort,
  ...args: Parameters<onTimestamp>
) => {
  port.postMessage([TimestampMsgID, ...args]);
};
export const moniterTimestampMsg = (port: MessagePort, action: onTimestamp) => {
  port.addEventListener("message", ({ data: [id, timestamp, duration] }) => {
    if (id !== TimestampMsgID) return;
    action(timestamp, duration);
  });
};
