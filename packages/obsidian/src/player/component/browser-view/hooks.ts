import { useAppSelector } from "@player/hooks";
import { useLatest, useUpdateEffect } from "ahooks";
import { debounce } from "obsidian";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { BrowserViewProps } from "./component";
import {
  BrowserViewRef,
  DevToolsMode,
  getElectronRect,
  hideView,
} from "./utils";

export const useHideView = (
  hidden: boolean | Electron.Rectangle,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  viewRef: BrowserViewRef,
) => {
  useEffect(() => {
    if (!containerRef.current || !viewRef.current) return;
    if (hidden === true) {
      // hide view during the update
      hideView(viewRef.current);
    } else {
      const rect = getElectronRect(
        hidden === false
          ? containerRef.current.getBoundingClientRect()
          : hidden,
      );
      viewRef.current.setBounds(rect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);
};

export const useEventListener = (
  ready: boolean,
  eventName: string,
  handler: ((...args: any[]) => void) | undefined,
  viewRef: BrowserViewRef,
) => {
  // https://github.com/electron/remote#passing-callbacks-to-the-main-process
  const handlerRef = useLatest(handler);
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view || view.webContents.isDestroyed()) {
      return;
    }
    const eventListener = (event: Event) => {
      if (handlerRef.current) handlerRef.current(event);
    };
    view.webContents.on(eventName as any, eventListener);
    return () => {
      view.webContents.off(eventName, eventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ready]);
};
export const useLoadSrc = (
  ready: boolean,
  {
    src,
    httpReferrer,
    userAgent,
  }: Pick<BrowserViewProps, "src" | "userAgent" | "httpReferrer">,
  viewRef: BrowserViewRef,
) => {
  // https://github.com/electron/remote#passing-callbacks-to-the-main-process
  useEffect(
    () => {
      const view = viewRef.current;
      if (!view?.webContents.loadURL) {
        return;
      }
      view.webContents.loadURL(src, { httpReferrer, userAgent });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, httpReferrer, ready],
  );
};
export const setDevTools = (
  open: boolean | DevToolsMode,
  view: Electron.BrowserView,
) => {
  let opened = view.webContents.isDevToolsOpened();
  if (open && !opened) {
    view.webContents.openDevTools({
      mode: typeof open === "string" ? open : "detach",
    });
  } else if (!open && opened) {
    view.webContents.closeDevTools();
  }
};
export const useChangableProp = (
  ready: boolean,
  props: Pick<BrowserViewProps, "userAgent" | "devtools" | "muted">,
  viewRef: BrowserViewRef,
) => {
  type View = Electron.BrowserView;
  const setUserAgentRef = useRef(
    debounce(
      (ua: string, view: View) => view.webContents.setUserAgent(ua),
      500,
      true,
    ),
  );
  // src changes are handled in loadSrc hook
  useUpdateEffect(
    () => {
      if (viewRef.current && props.userAgent !== undefined)
        setUserAgentRef.current(props.userAgent, viewRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, props.userAgent],
  );
  const setDevToolsRef = useRef(debounce(setDevTools, 500, true));
  useUpdateEffect(
    () => {
      if (viewRef.current && props.devtools !== undefined)
        setDevToolsRef.current(props.devtools, viewRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, props.devtools],
  );
  const setAudioMutedRef = useRef(
    debounce(
      (muted: boolean, view: View) => view.webContents.setAudioMuted(muted),
      200,
      true,
    ),
  );
  useUpdateEffect(
    () => {
      if (viewRef.current && props.muted !== undefined)
        setAudioMutedRef.current(props.muted, viewRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, props.muted],
  );
};
