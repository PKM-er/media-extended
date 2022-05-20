import { PlayerContext } from "@player";
import { useAppSelector } from "@player/hooks";
import { gotScreenshot, gotTimestamp } from "@player/thunk/action";
import { PlayerType } from "@slice/source/types";
import { observeStore, PlayerStore } from "@store";
import React, { useContext, useRef, useState } from "react";
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
    state.source.type === PlayerType.bilibili ? state.source.src : null,
  );

  const [hideView, setHideView] = useState(true);

  const store = useStore() as PlayerStore;

  const { plugin } = useContext(PlayerContext);

  const webviewRef = useRef<Electron.WebviewTag>(null);
  const portRef = useRefEffect<MessagePort>((port) => {
    const webview = webviewRef.current;
    if (!webview)
      throw new Error(
        "failed to inject script for bilibili: webview not ready",
      );
    (async () => {
      const injectCode = await plugin?.BilibiliInjectCode;
      if (!injectCode) {
        throw new Error(
          "failed to inject script for bilibili: no script code available",
        );
      }
      store.msgHandler.port = port;
      const showView = () => {
        window.clearTimeout(timeout);
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
          if (!fullscreen) return;
          console.log("enter web fscreen");
          showView();
        },
      );
      moniterTimestampMsg(port, (...args) =>
        store.dispatch(gotTimestamp(...args)),
      );
      moniterScreenshotMsg(port, (...args) =>
        store.dispatch(gotScreenshot(...args)),
      );
      await webview.executeJavaScript(injectCode);
    })();

    return () => {
      console.log("port unmount");
      store.msgHandler.port = null;
    };
  }, []);

  return src ? (
    <WebView
      ref={webviewRef}
      portRef={portRef}
      hideView={hideView}
      src={src}
      // preload={preload}
      style={style}
      className={className}
    />
  ) : null;
};
export default BilibiliPlayer;
