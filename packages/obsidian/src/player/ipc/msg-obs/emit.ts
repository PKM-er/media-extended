import { useAppDispatch, useAppSelector } from "@player/hooks";
import {
  captureScreenshotDone,
  selectCaptureScreenshotRequested,
} from "@slice/provider";
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

  const screenshot = useAppSelector(selectCaptureScreenshotRequested);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (screenshot) {
      getEmitter(emitterRef)
        .then((emitter) => {
          emitter && capture(emitter);
        })
        .then(() => dispatch(captureScreenshotDone()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshot]);
};
export default useActions;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const capture = async (emitter: Emitter) => {
  const [ab] = await emitter.invoke("cb:screenshot");
  app.vault.trigger("mx-screenshot", ab);
};

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
