import "./style.less";

import { BrowserView, getCurrentWindow } from "@electron/remote";
import { createPlayer, destroyPlayer } from "@slice/browser-view";
import { useLatest } from "ahooks";
import cls from "classnames";
import { debounce } from "obsidian";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import { IMessagePort, Message } from "./comms";
import createChannel from "./create-channel";
import {
  setDevTools,
  useApplyRepositioning,
  useChangableProp,
  useEventListener,
  useHideView,
  useLoadSrc,
  useViewHidden,
} from "./hooks";
import {
  destroyView,
  DevToolsMode,
  getElectronRect,
  initObsidianPort,
  WebContensEventsMap,
  WebContentsEventProps,
} from "./utils";

export type BrowserViewProps = {
  src: string;
  portRef?: React.RefCallback<IMessagePort<any, any>> &
    React.MutableRefObject<IMessagePort<any, any> | null>;
} & Partial<
  {
    hidden: boolean;
    hideView: boolean;
    webPreferences: Electron.WebPreferences;
    httpReferrer: string;
    userAgent: string;
    devtools: boolean | DevToolsMode;
    muted: boolean;
  } & WebContentsEventProps & {
      style: React.CSSProperties;
      className: string;
    }
>;

const BrowserViewComponent = (
  {
    hidden: hiddenProp = false,
    hideView = false,
    portRef,
    ...props
  }: BrowserViewProps,
  ref: React.ForwardedRef<Electron.BrowserView>,
) => {
  const internalRef = useRef<Electron.BrowserView>(null),
    viewRef = useMergeRefs([internalRef, ref]),
    winRef = useRef<Electron.BrowserWindow>(getCurrentWindow());

  /**
   * using queue and send port to  on didNavigate
   * to avoid sending message before ipcRender is ready
   */
  const sendPortQueueRef = useRef<(() => void) | null>(null);

  const [viewReady, setViewReady] = useState(false);

  const hideViewPropRef = useLatest(hiddenProp || hideView),
    [viewHidden, setViewHidden] = useViewHidden(hideViewPropRef);
  const [resizing, setResizing] = useState(false);

  for (const k of Object.keys(WebContensEventsMap)) {
    const propName = k as keyof typeof WebContensEventsMap,
      eventName = WebContensEventsMap[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(viewReady, eventName, props[propName], viewRef);
  }

  const dispatch = useDispatch();

  const { webPreferences, devtools, muted } = props;
  const containerRef = useRefEffect<HTMLDivElement>((container) => {
    const win = winRef.current;
    const view = new BrowserView({ webPreferences });
    win.addBrowserView(view);

    const rect = getElectronRect(container.getBoundingClientRect());
    view.setBounds(rect);
    // apply props
    devtools !== undefined && setDevTools(devtools, view);
    muted !== undefined && view.webContents.setAudioMuted(muted);

    setViewReady(true);
    console.log("browserview mounted");
    dispatch(createPlayer(view.webContents.id));
    viewRef.current = view;

    //#region message channel setup
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    const unloadPort = (function initPort() {
      if (!portRef) return () => {};
      const handleWillNav = () => {
          console.log("view reloaded");
          const prevPort = portRef.current;
          if (prevPort) {
            portRef.current = null;
            prevPort.close();
          }
          if (view) {
            sendPortQueueRef.current = createChannel(view);
            initObsidianPort(view.webContents.id, portRef);
          }
        },
        handleDidNav = () => {
          console.log("view navigated");
          if (sendPortQueueRef.current) {
            sendPortQueueRef.current();
            sendPortQueueRef.current = null;
          }
        };
      view.webContents.on("will-navigate", handleWillNav);
      view.webContents.on("did-navigate", handleDidNav);
      sendPortQueueRef.current = createChannel(view);
      initObsidianPort(view.webContents.id, portRef);
      return () => {
        view.webContents.off("will-navigate", handleWillNav);
        view.webContents.off("did-navigate", handleDidNav);
        portRef.current?.close();
      };
    })();

    //#endregion

    let requestUpdate = debounce(
      () => {
        setViewHidden(false);
        setResizing(false);
      },
      200,
      true,
    );
    const resizeObserver = new ResizeObserver(() => {
      setViewHidden(true);
      setResizing(true);
      requestUpdate();
    });
    resizeObserver.observe(container);
    // close view when obsidian is reloaded
    window.addEventListener(
      "beforeunload",
      () => viewRef.current && destroyView(viewRef.current, winRef.current),
      { once: true, passive: true },
    );

    return () => {
      unloadPort();
      if (viewRef.current) destroyView(viewRef.current, winRef.current);
      resizeObserver.disconnect();
      viewRef.current = null;
      // @ts-expect-error
      winRef.current = null;
      console.log("browserview unmounted");
      dispatch(destroyPlayer());
    };
  }, []);
  const repositioning = useApplyRepositioning(setViewHidden) || resizing;
  useHideView(viewHidden, containerRef, viewRef);
  useChangableProp(viewReady, props, viewRef);
  useLoadSrc(viewReady, props, viewRef);
  return (
    <div
      ref={containerRef}
      hidden={hiddenProp}
      className={cls(props.className, {
        "browser-view-hidden": viewHidden,
        "browser-view-repositioning": repositioning,
      })}
      style={{ width: "100%", height: "100%", minHeight: 10, ...props.style }}
    />
  );
};

export default React.forwardRef(BrowserViewComponent);
