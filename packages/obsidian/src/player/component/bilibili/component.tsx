import { PRELOAD_BILIBILI } from "@const";
import useActions from "@ipc/msg-obs/emit";
import getMediaMessageHandler from "@ipc/msg-view/handle";
import { PlayerContext } from "@player";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { join } from "path";
import React, { useContext, useMemo, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";

import WebView from "../webview";
import { ObsidianEventEmitter } from "./msg-obs";

const BilibiliPlayer = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const src = useAppSelector((state) =>
    state.provider.source?.from === "bilibili"
      ? state.provider.source.src
      : null,
  );

  const [hideView, setHideView] = useState(true),
    [emitterReady, setEmitterReady] = useState(false);

  const dispatch = useAppDispatch();
  const emitterRef = useRefEffect<ObsidianEventEmitter>((emitter) => {
    setEmitterReady(true);
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
    return () => {
      console.log("port unmount");
      setEmitterReady(false);
    };
  }, []);

  useActions(emitterReady, emitterRef as any);

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
      style={style}
      className={className}
    />
  ) : null;
};
export default BilibiliPlayer;
