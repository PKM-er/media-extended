// import React, { Component, PropTypes } from "react";
// import ReactDOM from "react-dom";
// import camelCase from "lodash.camelcase";
// import { changableProps, events, methods, props } from "./constants";

import { useAppSelector } from "@player/hooks";
import { useLatest } from "ahooks";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import { createPlayer, destroyPlayer } from "../../slice/webview";
import {
  ElectronWebviewEventProps,
  ElectronWebviewEventsMap,
  useEffectWithTarget,
} from "./utils";

type ElectronWebviewProps = { src: string } & Partial<
  {
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
  } & ElectronWebviewEventProps & {
      style: React.CSSProperties;
      className: string;
    }
>;

const ElectronWebview = React.forwardRef<
  Electron.WebviewTag,
  ElectronWebviewProps
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
>(function ElectronWebview(
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
    devtools,
    muted,
    style,
    className,
    ...events
  },
  ref,
) {
  const internalRef = useRef<Electron.WebviewTag>(null);
  const webviewRef = useMergeRefs([internalRef, ref]);

  for (const k of Object.keys(ElectronWebviewEventsMap)) {
    const propName = k as keyof typeof ElectronWebviewEventsMap,
      eventName = ElectronWebviewEventsMap[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(eventName, events[propName], webviewRef);
  }

  const dispatch = useDispatch();

  const containerRef = useRefEffect<HTMLDivElement>((container) => {
    const webview = document.createElement("webview");
    webview.style.height = "100%";
    webview.style.width = "100%";
    // changable
    webview.src = src;
    useragent !== undefined && (webview.useragent = useragent);
    devtools !== undefined && setDevTools(devtools, webview);
    muted !== undefined && webview.setAudioMuted(muted);
    // cannot be changed once loaded
    nodeintegration !== undefined &&
      (webview.nodeintegration = nodeintegration);
    plugins !== undefined && (webview.plugins = plugins);
    preload !== undefined && (webview.preload = preload);
    httpreferrer !== undefined && (webview.httpreferrer = httpreferrer);
    disablewebsecurity !== undefined &&
      (webview.disablewebsecurity = disablewebsecurity);
    partition !== undefined && (webview.partition = partition);
    allowpopups !== undefined && (webview.allowpopups = allowpopups);
    webpreferences !== undefined && (webview.webpreferences = webpreferences);
    enableblinkfeatures !== undefined &&
      (webview.enableblinkfeatures = enableblinkfeatures);
    disableblinkfeatures !== undefined &&
      (webview.disableblinkfeatures = disableblinkfeatures);

    webview.addEventListener("did-attach", () => {
      console.log("webview attached");
      dispatch(createPlayer());
      webviewRef.current = webview;
    });
    webview.addEventListener("destroyed", () => {
      console.log("webview destroyed");
      dispatch(destroyPlayer());
    });

    container.replaceChildren(webview);
    return () => {
      container.empty();
      webviewRef.current = null;
      console.log("webview unmounted");
      dispatch(destroyPlayer());
    };
  }, []);
  return <div ref={containerRef} className={className} style={style} />;
});

const useEventListener = (
  eventName: string,
  handler: ((...args: any[]) => void) | undefined,
  webview: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  const handlerRef = useLatest(handler);
  const ready = useAppSelector((state) => state.webview.playerReady);
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
  props: Pick<ElectronWebviewProps, "src" | "useragent" | "devtools" | "muted">,
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

export default ElectronWebview;
