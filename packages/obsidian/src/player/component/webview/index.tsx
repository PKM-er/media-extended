import { initObsidianPort } from "@ipc/comms";
import { EventEmitter } from "@ipc/emitter";
import { onHackReady } from "@ipc/hack";
import {
  CreateChannel,
  DisableInput,
  MxPreloadScriptUA,
} from "@ipc/hack/const";
import { useLatest } from "ahooks";
import cls from "classnames";
import { ipcRenderer } from "electron";
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
  emitterRef?: React.ForwardedRef<EventEmitter<any, any>>;
} & Partial<
  {
    hideView: boolean;
    nodeintegration: boolean;
    plugins: boolean;
    /** absolute path to preload script (without file://) */
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
>(function ElectronWebview({ hideView, className, style, ...props }, ref) {
  const webviewRef = useMergeRefs([useRef<Electron.WebviewTag>(null), ref]);
  const emitterRef = useMergeRefs([
    useRef<EventEmitter<any, any> | null>(null),
    props.emitterRef ?? null,
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

      let unloadPort: (() => void) | undefined;
      webview.addEventListener("did-attach", () => {
        console.log("webview attached");
        applyAttrsWithMethod(props, webview);
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        unloadPort = (function initPort() {
          const webviewId = webview.getWebContentsId();
          ipcRenderer
            .invoke(DisableInput, webviewId)
            .then((result) => console.log("disable input: ", result));
          ipcRenderer.send(CreateChannel, webviewId);
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

          const emitter = initObsidianPort(webviewId);
          emitterRef.current = emitter;
          return () => {
            webview.removeEventListener("will-navigate", handleWillNav);
            emitter.close();
            emitterRef.current = null;
          };
        })();
        webviewRef.current = webview;
        setViewAttached(true);
      });
      webview.addEventListener("destroyed", () => {
        console.log("webview destroyed");
        webviewRef.current = null;
        setViewAttached(false);
      });
      webview.addEventListener("dom-ready", () => {
        setHideView(false);
      });

      onHackReady(() => container.replaceChildren(webview));

      return () => {
        unloadPort?.();
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
