import type { AppDispatch } from "@player/store";
import {
  handleDurationChange,
  handleEnded,
  handleError,
  handlePause,
  handlePlaying,
  handleProgress,
  handleRateChange,
  handleSeeked,
  handleSeeking,
  handleTimeUpdate,
  handleVolumeChange,
  handleWaiting,
  updateSeeking,
} from "@slice/controls";
import { setRatio } from "@slice/interface";

import { MessageBasic, MsgSent } from "../comms/types";
import { MsgFromView } from ".";

const getMediaMessageHandler = (
  dispatch: AppDispatch,
): ((event: MessageEvent<MessageBasic>) => void) =>
  (({ data: msg }: MessageEvent<MsgSent<MsgFromView>>) => {
    switch (msg.event) {
      case "play":
        dispatch(handlePlaying());
        return;
      case "pause":
        dispatch(handlePause());
        return;
      case "seeked":
        dispatch(handleSeeked());
        return;
      case "seeking":
        dispatch(handleSeeking());
        return;
      case "waiting":
        dispatch(handleWaiting());
        return;
      case "ended":
        dispatch(handleEnded());
        return;
      case "ratechange":
        dispatch(handleRateChange(msg.data[0]));
        return;
      case "timeupdate":
        dispatch(handleTimeUpdate(msg.data[0]));
        return;
      case "volumechange":
        const [muted, volume] = msg.data;
        dispatch(handleVolumeChange({ muted, volume }));
        return;
      case "durationchange":
        dispatch(handleDurationChange(msg.data[0]));
        return;
      case "loadedmetadata":
        const [videoWidth, videoHeight] = msg.data;
        dispatch(setRatio([videoWidth, videoHeight]));
        return;
      case "progress":
      case "canplay":
        const [buffered, duration] = msg.data;
        if (buffered) dispatch(handleProgress(buffered));
        if (duration) dispatch(handleDurationChange(duration));
        return;
      case "error":
        const [code, message] = msg.data;
        dispatch(handleError({ code, message }));
        return;
      case "update-buffer":
        dispatch(handleProgress(msg.data[0]));
        return;
      case "update-seeking":
        dispatch(updateSeeking(msg.data[0]));
        return;
      default:
        return;
    }
  }) as any;
export default getMediaMessageHandler;
