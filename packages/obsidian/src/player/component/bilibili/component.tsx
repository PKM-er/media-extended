import { PRELOAD_BILIBILI } from "@const";
import { PlayerContext } from "@player";
import { useAppSelector } from "@player/hooks";
import { observeStore, PlayerStore } from "@player/store";
import { gotScreenshot, gotTimestamp } from "@slice/action/thunk";
import { join } from "path";
import React, { useContext, useMemo, useState } from "react";
import { useStore } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";

import { moniterScreenshotMsg } from "../hook-player/screenshot";
import { moniterTimestampMsg } from "../hook-player/timestamp";
import WebView from "../webview";

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

  const [hideView, setHideView] = useState(true);

  const store = useStore() as PlayerStore;

  const portRef = useRefEffect<MessagePort>((port) => {
    store.msgHandler.port = port;
    const showView = () => {
      window.clearTimeout(timeout);
      console.log("enter web fscreen");
      setHideView(false);
    };
    const timeout = setTimeout(() => {
      unsub();
      console.log("web fullscreen timeout");
      showView();
    }, 10e3);
    const unsub = observeStore(
      store,
      (state) => state.bilibili.webFscreen,
      (fullscreen) => {
        if (fullscreen) showView();
      },
    );
    moniterTimestampMsg(port, (...args) =>
      store.dispatch(gotTimestamp(...args)),
    );
    moniterScreenshotMsg(port, (...args) =>
      store.dispatch(gotScreenshot(...args)),
    );
    return () => {
      console.log("port unmount");
      store.msgHandler.port = null;
    };
  }, []);

  const { pluginDir } = useContext(PlayerContext);
  if (!pluginDir)
    throw new Error("failed to init bilibili player: pluginDir not available");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preload = useMemo(() => join(pluginDir, PRELOAD_BILIBILI), []);

  return src ? (
    <WebView
      portRef={portRef}
      hideView={hideView}
      src={src}
      preload={preload}
      style={style}
      className={className}
    />
  ) : null;
};
export default BilibiliPlayer;
