import { PRELOAD_BILIBILI } from "@const";
import getMediaMessageHandler from "@ipc/msg-view/handle";
import { PlayerContext } from "@player";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { join } from "path";
import React, { useContext, useMemo, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";

import WebView from "../webview";
import { ObsidianEventEmitter, useActions } from "./msg-obs";

const BilibiliPlayer = () => {
  const src = useAppSelector((state) =>
    state.provider.source?.from === "bilibili"
      ? state.provider.source.src
      : null,
  );

  const [hideView, setHideView] = useState(true);

  const dispatch = useAppDispatch();
  const emitterRef = useRefEffect<ObsidianEventEmitter>((emitter) => {
    emitter.addDirectListener(getMediaMessageHandler(dispatch));
    const showView = () => {
      window.clearTimeout(timeout);
      console.log("enter web fscreen");
      setHideView(false);
    };
    const timeout = setTimeout(() => {
      emitter.off("enter-web-fullscreen", showView);
      console.log("web fullscreen timeout");
      showView();
    }, 10e3);
    emitter.on("enter-web-fullscreen", showView);
    return () => console.log("port unmount");
  }, []);

  useActions(emitterRef as any);

  const { pluginDir } = useContext(PlayerContext);
  if (!pluginDir)
    throw new Error("failed to init bilibili player: pluginDir not available");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preload = useMemo(() => join(pluginDir, PRELOAD_BILIBILI), []);

  return src ? (
    <WebView
      emitterRef={emitterRef}
      hideView={hideView}
      src={src}
      preload={preload}
    />
  ) : null;
};
export default BilibiliPlayer;
