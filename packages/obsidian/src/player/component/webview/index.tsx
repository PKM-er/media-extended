import { getObsidianPort } from "@ipc/comms";
import { EventEmitter } from "@ipc/emitter";
import {
  CreateChannel,
  DisableInput,
  MxScriptRegistered,
} from "@ipc/main-ps/channels";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { createPlayer, destroyPlayer, portReady } from "@slice/browser-view";
import { useLatest } from "ahooks";
import cls from "classnames";
import { ipcRenderer } from "electron";
import React, { useRef, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import { onHackReady } from "../../ipc/hack-ready";
import {
  initObsidianPort,
  useEffectWithTarget,
  WebviewEventProps,
  WebviewEventsMap,
} from "./utils";

type WebviewProps = {
  src: string;
  emitterRef?: React.RefCallback<EventEmitter<any, any>> &
    React.MutableRefObject<EventEmitter<any, any> | null>;
} & Partial<
  {
    hideView: boolean;
    nodeintegration: boolean;
    plugins: boolean;
    preload: string;
    httpreferrer: string;
    useragent: string;
    disablewebsecurity: boolean;
    partition: string;
    allowpopups: boolean;
    webpreferences: string;
    enableblinkfeatures: string;
    disableblinkfeatures: string;
    devtools: boolean;
    muted: boolean;
  } & WebviewEventProps & {
      style: React.CSSProperties;
      className: string;
    }
>;

const applyAttrs = (
  {
    src,
    nodeintegration,
    plugins,
    preload,
    httpreferrer,
    useragent,
    disablewebsecurity,
    partition,
    allowpopups,
    webpreferences,
    enableblinkfeatures,
    disableblinkfeatures,
  }: WebviewProps,
  webview: Electron.WebviewTag,
) => {
  // changable
  webview.src = src;
  useragent !== undefined && (webview.useragent = useragent);
  // cannot be changed once loaded
  nodeintegration !== undefined && (webview.nodeintegration = nodeintegration);
  plugins !== undefined && (webview.plugins = plugins);
  httpreferrer !== undefined && (webview.httpreferrer = httpreferrer);
  disablewebsecurity !== undefined &&
    (webview.disablewebsecurity = disablewebsecurity);
  partition !== undefined && (webview.partition = partition);
  allowpopups !== undefined && (webview.allowpopups = allowpopups);
  webpreferences !== undefined && (webview.webpreferences = webpreferences);
  preload !== undefined && (webview.preload = "file://" + preload);
  enableblinkfeatures !== undefined &&
    (webview.enableblinkfeatures = enableblinkfeatures);
  disableblinkfeatures !== undefined &&
    (webview.disableblinkfeatures = disableblinkfeatures);
};
const applyAttrsWithMethod = (
  { devtools, muted }: WebviewProps,
  webview: Electron.WebviewTag,
) => {
  devtools !== undefined && setDevTools(devtools, webview);
  muted !== undefined && webview.setAudioMuted(muted);
};

const WebView = React.forwardRef<
  Electron.WebviewTag,
  WebviewProps
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
>(function ElectronWebview(
  { hideView, emitterRef, className, style, ...props },
  ref,
) {
  const internalRef = useRef<Electron.WebviewTag>(null);
  const webviewRef = useMergeRefs([internalRef, ref]);

  const dispatch = useAppDispatch();

  const [internalHideView, setHideView] = useState(true);

  for (const k of Object.keys(WebviewEventsMap)) {
    const propName = k as keyof typeof WebviewEventsMap,
      eventName = WebviewEventsMap[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(eventName, props[propName], webviewRef);
  }

  const containerRef = useRefEffect<HTMLDivElement>((container) => {
    const webview = document.createElement("webview");
    webview.style.height = "100%";
    webview.style.width = "100%";
    applyAttrs(props, webview);

    let unloadPort: (() => void) | undefined;
    webview.addEventListener("did-attach", () => {
      console.log("webview attached");
      applyAttrsWithMethod(props, webview);
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      unloadPort = (function initPort() {
        if (!emitterRef) return () => {};
        const webviewId = webview.getWebContentsId();
        ipcRenderer
          .invoke(DisableInput, webviewId)
          .then((result) => console.log("disable input: ", result));
        ipcRenderer.send(CreateChannel, webviewId);
        getObsidianPort(webviewId);
        const handleWillNav = () => {
          // cannot use will-prevernt-unload event
          // since preventDefault will not work via remote
          // https://github.com/electron/electron/issues/23521
          console.log("view reloaded");
          const prevPort = emitterRef.current;
          if (prevPort) {
            emitterRef.current = null;
            prevPort.close();
          }
          emitterRef.current = initObsidianPort(webviewId);
        };
        webview.addEventListener("will-navigate", handleWillNav);

        emitterRef.current = initObsidianPort(webviewId);
        dispatch(portReady(true));
        return () => {
          webview.removeEventListener("will-navigate", handleWillNav);
          emitterRef.current?.close();
          dispatch(portReady(false));
        };
      })();
      dispatch(createPlayer());
      webviewRef.current = webview;
    });
    webview.addEventListener("destroyed", () => {
      console.log("webview destroyed");
      dispatch(destroyPlayer());
    });
    webview.addEventListener("dom-ready", () => {
      setHideView(false);
    });

    onHackReady(() => container.replaceChildren(webview));

    return () => {
      unloadPort?.();
      container.empty();
      webviewRef.current = null;
      console.log("webview unmounted");
      dispatch(destroyPlayer());
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className={cls(className, {
        "mx__hide-view": hideView || internalHideView,
      })}
      style={style}
    />
  );
});

const useEventListener = (
  eventName: string,
  handler: ((...args: any[]) => void) | undefined,
  webview: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  const handlerRef = useLatest(handler);
  const ready = useAppSelector((state) => state.browserView.viewReady);
  useEffectWithTarget(
    () => {
      const targetElement = webview.current;
      if (!targetElement?.addEventListener) {
        return;
      }
      const eventListener = (event: Event) => {
        if (handlerRef.current) handlerRef.current(event);
      };
      targetElement.addEventListener(eventName, eventListener);
      return () => {
        targetElement.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, ready],
    webview,
  );
};

const setDevTools = (open: boolean, webview: Electron.WebviewTag) => {
  if (open && !webview.isDevToolsOpened()) {
    webview.openDevTools();
  } else if (!open && webview.isDevToolsOpened()) {
    webview.closeDevTools();
  }
};

const useChangableProp = (
  props: Pick<WebviewProps, "src" | "useragent" | "devtools" | "muted">,
  webview: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  useEffectWithTarget(
    () => {
      webview.current && (webview.current.src = props.src);
    },
    [props.src],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.useragent !== undefined)
        webview.current.setUserAgent(props.useragent);
    },
    [props.useragent],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.devtools !== undefined)
        setDevTools(props.devtools, webview.current);
    },
    [props.devtools],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.muted !== undefined)
        webview.current.setAudioMuted(props.muted);
    },
    [props.muted],
    webview,
  );
};

export default WebView;
