import { useAppDispatch, useAppSelector } from "@player/hooks";
import {
  gotScreenshot,
  gotTimestamp,
  selectScreenshotRequested,
  selectTimestampRequested,
} from "@slice/action";
import { useUpdateEffect } from "ahooks";
import { useCallback, useEffect, useRef } from "react";

import { EventEmitter } from "../emitter";
import { MsgFromView } from "../msg-view";
import { MsgFromObsidian } from ".";

type Emitter = EventEmitter<MsgFromView, MsgFromObsidian>;
const useActions = (
  emitterReady: boolean,
  emitterRef: React.MutableRefObject<Emitter | null>,
) => {
  const queue = useRef<any[]>([]);
  const send = useCallback<Emitter["send"]>(async (event, ...data) => {
    if (!emitterRef.current) {
      queue.current.push([event, data]);
      return;
    } else {
      await emitterRef.current.send(event, ...data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useUpdateEffect(() => {
    if (emitterReady) {
      queue.current.forEach(([event, data]) => {
        send(event, ...data);
      });
      queue.current.length = 0;
    }
  }, [emitterReady]);
  const paused = useAppSelector((state) => state.controls.paused);
  useEffect(() => {
    send(paused ? "pause" : "play");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const fullscreen = useAppSelector((state) => state.controls.fullscreen);
  useEffect(() => {
    send(fullscreen ? "enter-fullscreen" : "exit-fullscreen");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const frag = useAppSelector((state) => state.controls.fragment);
  useEffect(() => {
    send("timefrag", frag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag]);

  const playbackRate = useAppSelector((state) => state.controls.playbackRate);
  useEffect(() => {
    send("changerate", playbackRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRate]);

  const muted = useAppSelector((state) => state.controls.muted);
  const volume = useAppSelector((state) => state.controls.volume);
  useEffect(() => {
    send("changevolume", muted, volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, volume]);

  const userSeek = useAppSelector((state) => state.controls.userSeek);
  useEffect(() => {
    if (userSeek) {
      send("updatetime", userSeek.currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSeek]);

  const screenshot = useAppSelector(selectScreenshotRequested);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (screenshot) {
      getEmitter(emitterRef).then(async (emitter) => {
        let buffer: ArrayBuffer | undefined;
        if (emitter) {
          [buffer] = await emitter?.invoke("cb:screenshot");
        }
        dispatch(gotScreenshot(buffer));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshot]);

  const timestamp = useAppSelector(selectTimestampRequested);
  useEffect(() => {
    if (timestamp) {
      getEmitter(emitterRef).then(async (emitter) => {
        let time: number | undefined, duration: number | undefined;
        if (emitter) {
          [time, duration] = await emitter?.invoke("cb:timestamp");
        }
        dispatch(gotTimestamp(time, duration));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timestamp]);
};
export default useActions;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getEmitter = async (
  emitterRef: React.MutableRefObject<Emitter | null>,
): Promise<Emitter | null> => {
  if (!emitterRef.current) {
    await sleep(5e3);
    if (!emitterRef.current) {
      console.error(
        "failed to capture screenshot: event emitter not available",
      );
      return null;
    }
  }
  return emitterRef.current;
};
