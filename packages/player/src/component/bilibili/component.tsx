import { PlayerContext } from "@context";
import { moniterScreenshotMsg } from "@hook-player/screenshot";
import { moniterTimestampMsg } from "@hook-player/timestamp";
import { useAppSelector, usePlayerStore } from "@store-hooks";
import initCode from "inline:../../user-script/init";
import { selectBilibiliSrc, selectBiliWebFscreen } from "mx-store";
import WebView from "mx-webview";
import React, { useContext, useRef, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";

import { SendUserScriptID } from "../../user-script/const";

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

  const { getUserScriptFor, actions } = useContext(PlayerContext);

  const webviewRef = useRef<Electron.WebviewTag>(null);
  const portRef = useRefEffect<MessagePort>((port) => {
    const webview = webviewRef.current;
    if (!webview)
      throw new Error(
        "failed to inject script for bilibili: webview not ready",
      );
    (async () => {
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

      // prepare to recieve user script
      await webview.executeJavaScript(initCode);

      let script = src ? await getUserScriptFor(src) : null;
      if (!script) {
        throw new Error(
          "failed to inject script for bilibili: no script code available",
        );
      }
      script.css && webview.insertCSS(script.css);
      port.postMessage([SendUserScriptID, script.js]);
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
