import "./style.less";

import { BrowserView, getCurrentWindow } from "@electron/remote";
import { useAppSelector } from "@player/hooks";
import { createPlayer, destroyPlayer, portReady } from "@slice/browser-view";
import cls from "classnames";
import { ipcRenderer } from "electron";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import createChannel from "./create-channel";
import { EventEmitter } from "./emitter";
import {
  setDevTools,
  useChangableProp,
  useEventListener,
  useHideView,
  useLoadSrc,
} from "./hooks";
import { DisableInput } from "./main-ps/channels";
import { useUpdateOnResize } from "./use-update-bound";
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
  emitterRef?: React.RefCallback<EventEmitter<any, any>> &
    React.MutableRefObject<EventEmitter<any, any> | null>;
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
    emitterRef,
    ...props
  }: BrowserViewProps,
  ref: React.ForwardedRef<Electron.BrowserView>,
) => {
  const internalRef = useRef<Electron.BrowserView>(null),
    viewRef = useMergeRefs([internalRef, ref]),
    winRef = useRef<Electron.BrowserWindow>(getCurrentWindow());

  /**
   * using queue and send port to view on didNavigate
   * to avoid sending message before ipcRender is ready
   */
  const sendPortQueueRef = useRef<(() => void) | null>(null);

  const [viewReady, setViewReady] = useState(false);

  const [resizing, setResizing] = useState<boolean | Electron.Rectangle>(false);
  const repositioning = useAppSelector(
    (state) => state.browserView.repositioning,
  );

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
    const viewId = view.webContents.id;
    win.addBrowserView(view);

    const rect = getElectronRect(container.getBoundingClientRect());
    view.setBounds(rect);
    // apply props
    devtools !== undefined && setDevTools(devtools, view);
    muted !== undefined && view.webContents.setAudioMuted(muted);
    ipcRenderer
      .invoke(DisableInput, viewId)
      .then((result) => console.log("disable input: ", result));

    setViewReady(true);
    console.log("browserview mounted");
    dispatch(createPlayer(viewId));
    viewRef.current = view;

    //#region message channel setup
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    const unloadPort = (function initPort() {
      if (!emitterRef) return () => {};
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
          if (view) {
            sendPortQueueRef.current = createChannel(view);
            emitterRef.current = initObsidianPort(viewId);
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
      emitterRef.current = initObsidianPort(viewId);
      dispatch(portReady(true));
      return () => {
        view.webContents.off("will-navigate", handleWillNav);
        view.webContents.off("did-navigate", handleDidNav);
        emitterRef.current?.close();
        dispatch(portReady(false));
      };
    })();

    //#endregion
    // close view when obsidian is reloaded
    window.addEventListener(
      "beforeunload",
      () => viewRef.current && destroyView(viewRef.current, winRef.current),
      { once: true, passive: true },
    );

    return () => {
      unloadPort();
      if (viewRef.current) destroyView(viewRef.current, winRef.current);
      viewRef.current = null;
      // @ts-expect-error
      winRef.current = null;
      console.log("browserview unmounted");
      dispatch(destroyPlayer());
    };
  }, []);

  useUpdateOnResize(
    containerRef,
    () => setResizing(true),
    () => setResizing(false),
  );

  const viewHidden = hiddenProp || hideView || repositioning || resizing,
    repositionState = repositioning || resizing;

  useHideView(viewHidden, containerRef, viewRef);
  useChangableProp(viewReady, props, viewRef);
  useLoadSrc(viewReady, props, viewRef);
  return (
    <div
      ref={containerRef}
      hidden={hiddenProp}
      className={cls(props.className, {
        "browser-view-hidden": viewHidden,
        "browser-view-repositioning": repositionState,
      })}
      style={{ width: "100%", height: "100%", minHeight: 50, ...props.style }}
    />
  );
};

export default React.forwardRef(BrowserViewComponent);
