import { MxPreloadScriptUA } from "@ipc/hack/const";
import { useLatest } from "ahooks";
import cls from "classnames";
import RecievePort from "inline:./recieve-port";
import React, { useRef, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import {
  useEffectWithTarget,
  WebviewEventProps,
  WebviewEventsMap,
} from "./utils";

type WebviewProps = {
  src: string;
  portRef?: React.ForwardedRef<MessagePort>;
} & Partial<
  {
    hideView: boolean;
    nodeintegration: boolean;
    plugins: boolean;
    /** absolute path to preload script (without file://) */
    // preload: string;
    targetOrigin: string;
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
    // preload,
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
  webview.useragent = MxPreloadScriptUA + (useragent ?? "");
  // cannot be changed once loaded
  nodeintegration !== undefined && (webview.nodeintegration = nodeintegration);
  plugins !== undefined && (webview.plugins = plugins);
  httpreferrer !== undefined && (webview.httpreferrer = httpreferrer);
  disablewebsecurity !== undefined &&
    (webview.disablewebsecurity = disablewebsecurity);
  partition !== undefined && (webview.partition = partition);
  allowpopups !== undefined && (webview.allowpopups = allowpopups);
  webpreferences !== undefined && (webview.webpreferences = webpreferences);
  // preload !== undefined && (webview.preload = "file://" + preload);
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
  { hideView, className, style, targetOrigin = "*", ...props },
  ref,
) {
  const webviewRef = useMergeRefs([useRef<Electron.WebviewTag>(null), ref]);
  const portRef = useMergeRefs([
    useRef<MessagePort | null>(null),
    props.portRef ?? null,
  ]);

  const [internalHideView, setHideView] = useState(true);

  const [viewAttached, setViewAttached] = useState(false);

  for (const k of Object.keys(WebviewEventsMap)) {
    const propName = k as keyof typeof WebviewEventsMap,
      eventName = WebviewEventsMap[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(viewAttached, eventName, props[propName], webviewRef);
  }
  useChangableProp(viewAttached, props, webviewRef);

  const containerRef = useRefEffect<HTMLDivElement>(
    (container) => {
      const webview = document.createElement("webview");
      webview.style.height = "100%";
      webview.style.width = "100%";
      applyAttrs(props, webview);

      const initPort = async () => {
        await webview.executeJavaScript(RecievePort);
        const { port1: portOb, port2: portView } = new MessageChannel();
        portRef.current = portOb;
        webview.contentWindow.postMessage("port", targetOrigin, [portView]);
      };

      webview.addEventListener("did-attach", () => {
        console.log("webview attached");
        applyAttrsWithMethod(props, webview);
        webviewRef.current = webview;
        setViewAttached(true);
      });
      webview.addEventListener("destroyed", () => {
        console.log("webview destroyed");
        setDevTools(false, webview);
        webviewRef.current = null;
        setViewAttached(false);
      });
      webview.addEventListener("dom-ready", () => {
        console.log("webview dom ready");
        setHideView(false);
        initPort();
      });
      container.replaceChildren(webview);
      return () => {
        // don't do unload event handler here,
        // webview already unmouted from dom
        if (portRef.current) {
          portRef.current.close();
          portRef.current = null;
        }
        webviewRef.current = null;
        setViewAttached(false);
        container.empty();
        console.log("webview unmounted");
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
  viewReady: boolean,
  eventName: string,
  handler: ((...args: any[]) => void) | undefined,
  webview: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  const handlerRef = useLatest(handler);
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
    [eventName, viewReady],
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
  viewReady: boolean,
  props: Pick<WebviewProps, "src" | "useragent" | "devtools" | "muted">,
  webview: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  useEffectWithTarget(
    () => {
      webview.current && (webview.current.src = props.src);
    },
    [props.src, viewReady],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.useragent !== undefined)
        webview.current.setUserAgent(props.useragent);
    },
    [props.useragent, viewReady],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.devtools !== undefined)
        setDevTools(props.devtools, webview.current);
    },
    [props.devtools, viewReady],
    webview,
  );
  useEffectWithTarget(
    () => {
      if (webview.current && props.muted !== undefined)
        webview.current.setAudioMuted(props.muted);
    },
    [props.muted, viewReady],
    webview,
  );
};

export default WebView;
