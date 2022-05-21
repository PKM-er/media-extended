import { PlayerContext } from "@context";
import { moniterScreenshotMsg } from "@hook-player/screenshot";
import { moniterTimestampMsg } from "@hook-player/timestamp";
import { useAppSelector } from "@store-hooks";
import { PlayerType } from "mx-store";
import { observeStore, PlayerStore } from "mx-store";
import React, { useContext, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";

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

  const { getBiliInjectCode, actions } = useContext(PlayerContext);

  const webviewRef = useRef<Electron.WebviewTag>(null);
  const portRef = useRefEffect<MessagePort>((port) => {
    const webview = webviewRef.current;
    if (!webview)
      throw new Error(
        "failed to inject script for bilibili: webview not ready",
      );
    (async () => {
      const injectCode = await getBiliInjectCode();
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
        actions.gotTimestamp(store.dispatch, args),
      );
      moniterScreenshotMsg(port, (...args) =>
        actions.gotScreenshot(store.dispatch, args),
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
