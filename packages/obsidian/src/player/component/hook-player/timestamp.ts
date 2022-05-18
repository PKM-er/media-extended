import { Media } from "@player/utils/media";
import { PlayerStore, selectTimestampRequested, subscribe } from "@store";

type onTimestamp = (timestamp: number, duration: number) => void;

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
