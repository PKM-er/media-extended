import { BrowserView, getCurrentWindow } from "@electron/remote";
import { initObsidianPort } from "@ipc/comms";
import createChannel from "@ipc/create-channel";
import { EventEmitter } from "@ipc/emitter";
import { DisableInput } from "@ipc/main-ps/channels";
import cls from "classnames";
import { ipcRenderer } from "electron";
import React, { useRef, useState } from "react";
import { useRefEffect } from "react-use-ref-effect";
import { useMergeRefs } from "use-callback-ref";

import {
  setDevTools,
  useChangableProp,
  useEventListener,
  useHideView,
  useLoadSrc,
} from "./hooks";
import { useUpdateOnResize } from "./use-update-bound";
import {
  destroyView,
  DevToolsMode,
  getElectronRect,
  WebContensEventsMap,
  WebContentsEventProps,
} from "./utils";

export type BrowserViewProps = {
  src: string;
  emitterRef?: React.ForwardedRef<EventEmitter<any, any>>;
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
  { hidden: hiddenProp = false, hideView = false, ...props }: BrowserViewProps,
  ref: React.ForwardedRef<Electron.BrowserView>,
) => {
  const viewRef = useMergeRefs([useRef<Electron.BrowserView>(null), ref]);
  const emitterRef = useMergeRefs([
    useRef<EventEmitter<any, any> | null>(null),
    props.emitterRef ?? null,
  ]);
  const winRef = useRef<Electron.BrowserWindow>(getCurrentWindow());

  /**
   * using queue and send port to view on didNavigate
   * to avoid sending message before ipcRender is ready
   */
  const sendPortQueueRef = useRef<(() => void) | null>(null);

  const [viewReady, setViewReady] = useState(false);

  const [resizing, setResizing] = useState<boolean | Electron.Rectangle>(false);

  for (const k of Object.keys(WebContensEventsMap)) {
    const propName = k as keyof typeof WebContensEventsMap,
      eventName = WebContensEventsMap[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(viewReady, eventName, props[propName], viewRef);
  }

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
      return () => {
        view.webContents.off("will-navigate", handleWillNav);
        view.webContents.off("did-navigate", handleDidNav);
        emitterRef.current?.close();
        emitterRef.current = null;
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
    };
  }, []);

  useUpdateOnResize(
    containerRef,
    () => setResizing(true),
    () => setResizing(false),
  );

  const viewHidden = hiddenProp || hideView || resizing;

  useHideView(viewHidden, containerRef, viewRef);
  useChangableProp(viewReady, props, viewRef);
  useLoadSrc(viewReady, props, viewRef);
  return (
    <div
      ref={containerRef}
      hidden={hiddenProp}
      className={cls(props.className, {
        "browser-view-hidden": viewHidden,
      })}
      style={{ width: "100%", height: "100%", minHeight: 50, ...props.style }}
    />
  );
};

export default React.forwardRef(BrowserViewComponent);
