import { PlayerContext } from "@context";
import { moniterScreenshotMsg } from "@hook-player/screenshot";
import { moniterTimestampMsg } from "@hook-player/timestamp";
import { useAppSelector, usePlayerStore } from "@store-hooks";
import { selectBilibiliSrc, selectBiliWebFscreen } from "mx-store";
import WebView from "mx-webview";
import React, { useContext, useRef, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";

const BilibiliPlayer = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const src = useAppSelector(selectBilibiliSrc);

  const [hideView, setHideView] = useState(true);

  const store = usePlayerStore();

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
      store.webviewMsg.port = port;
      if (selectBiliWebFscreen(store.getState())) {
        const tryReveal = () => {
            if (selectBiliWebFscreen(store.getState())) {
              console.log("enter web fscreen");
              window.clearTimeout(timeout);
              setTimeout(() => setHideView(false), 500);
            } else {
              window.clearTimeout(timeout);
              setHideView(false);
            }
          },
          options = { once: true } as any;
        const timeout = setTimeout(() => {
          webview.removeEventListener("did-stop-loading", tryReveal, options);
          console.log("web fullscreen timeout");
          setHideView(false);
        }, 10e3);
        webview.addEventListener("did-stop-loading", tryReveal, options);
      } else {
        setHideView(false);
      }

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
      store.webviewMsg.port = null;
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
