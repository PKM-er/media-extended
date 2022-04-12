import { useAppDispatch, useAppSelector } from "@player/hooks";
import {
  captureScreenshotDone,
  selectCaptureScreenshotRequested,
} from "@slice/provider";
import { useUpdateEffect } from "ahooks";
import { useEffect } from "react";

import { EventEmitter } from "../emitter";
import { MsgFromView } from "../msg-view";
import { MsgFromObsidian } from ".";

const useActions = (
  emitterRef: React.MutableRefObject<EventEmitter<
    MsgFromView,
    MsgFromObsidian
  > | null>,
) => {
  const paused = useAppSelector((state) => state.controls.paused);
  useUpdateEffect(() => {
    if (paused) {
      emitterRef.current?.send("pause");
    } else {
      emitterRef.current?.send("play");
    }
  }, [paused]);

  const fullscreen = useAppSelector((state) => state.controls.fullscreen);
  useUpdateEffect(() => {
    if (fullscreen) {
      emitterRef.current?.send("enter-fullscreen");
    } else {
      emitterRef.current?.send("exit-fullscreen");
    }
  }, [fullscreen]);

  const frag = useAppSelector((state) => state.controls.fragment),
    portReady = useAppSelector((state) => state.browserView.portReady);
  useEffect(() => {
    emitterRef.current?.send("timefrag", frag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag, portReady]);

  const playbackRate = useAppSelector((state) => state.controls.playbackRate);
  useUpdateEffect(() => {
    emitterRef.current?.send("changerate", playbackRate);
  }, [playbackRate]);

  const muted = useAppSelector((state) => state.controls.muted);
  const volume = useAppSelector((state) => state.controls.volume);
  useUpdateEffect(() => {
    emitterRef.current?.send("changevolume", muted, volume);
  }, [muted, volume]);

  const userSeek = useAppSelector((state) => state.controls.userSeek);
  useUpdateEffect(() => {
    if (userSeek) {
      emitterRef.current?.send("updatetime", userSeek.currentTime);
    }
  }, [userSeek]);

  const screenshot = useAppSelector(selectCaptureScreenshotRequested);
  const screenshot2 = useAppSelector((state) => state.provider);
  const dispatch = useAppDispatch();
  useUpdateEffect(() => {
    console.log(screenshot, screenshot2);
    if (screenshot) {
      (async () => {
        if (!emitterRef.current) {
          console.error("event emitter is not ready");
        } else {
          const [ab] = await emitterRef.current.invoke("cb:screenshot");
          app.vault.trigger("mx-screenshot", ab);
        }
        dispatch(captureScreenshotDone());
      })();
    }
  }, [screenshot]);
};
export default useActions;
