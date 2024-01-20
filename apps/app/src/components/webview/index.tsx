import type { WebviewTag } from "electron";
import type { ComponentProps } from "react";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMergeRefs } from "use-callback-ref";
import { cn } from "@/lib/utils";
import { getUserAgent } from "@/web/ua";
import { useEvents, type WebviewEventProps } from "./events";

export type WebviewElement = WebviewTag & {
  /**
   * @see https://developer.chrome.com/docs/apps/reference/webviewTag?hl=zh-cn#type-ContentWindow
   */
  contentWindow: Window;
};

interface WebviewProps {
  devtools?: boolean;
  muted?: boolean;
}

export const WebView = forwardRef<
  WebviewElement,
  WebviewProps &
    Partial<WebviewTagAttributes> &
    WebviewEventProps &
    React.ComponentProps<"div">
>(function WebView(
  { devtools = false, muted = false, className, useragent, ...props },
  ref,
) {
  const webviewRef = useRef<WebviewElement>(null);

  const [domReady, setIsDomReady] = useState(false);
  const restProps = useEvents(props, webviewRef);
  useDevTools(devtools, webviewRef, domReady);
  useMuted(muted, webviewRef, domReady);
  const ua = useUserAgent(
    useragent ?? navigator.userAgent,
    webviewRef,
    domReady,
  );

  useEffect(() => {
    if (!webviewRef.current) return;
    const webview = webviewRef.current as typeof webviewRef.current;
    webview.addEventListener("dom-ready", setDomReady);
    webview.addEventListener("will-navigate", setDomNotReady);
    return () => {
      webview.removeEventListener("dom-ready", setDomReady);
      webview.removeEventListener("will-navigate", setDomNotReady);
    };
    function setDomReady() {
      setIsDomReady(true);
    }
    function setDomNotReady() {
      setIsDomReady(false);
    }
  }, []);

  return (
    <webview
      ref={useMergeRefs([webviewRef, ref])}
      className={cn("h-full w-full", className)}
      // eslint-disable-next-line react/no-unknown-property
      useragent={ua}
      {...restProps}
    />
  );
});

/* @see https://www.electronjs.org/docs/latest/api/webview-tag#tag-attributes */
type WebviewTagAttributes = Pick<
  WebviewTag,
  | "src"
  | "nodeintegration"
  | "nodeintegrationinsubframes"
  | "plugins"
  | "preload"
  | "httpreferrer"
  | "useragent"
  | "disablewebsecurity"
  | "partition"
  | "allowpopups"
  | "webpreferences"
  | "enableblinkfeatures"
  | "disableblinkfeatures"
> &
  Pick<ComponentProps<"div">, "className" | "style">;

function useUserAgent(
  propValue: string | undefined,
  ref: React.RefObject<WebviewTag>,
  domReady: boolean,
) {
  const userAgent = useMemo(() => {
    const ua = propValue ?? navigator.userAgent;
    // hide electron/obsidian in case website consider it as a bot
    return getUserAgent(ua);
  }, [propValue]);
  useEffect(() => {
    if (!ref.current || !domReady || userAgent === ref.current.useragent)
      return;
    ref.current.setUserAgent(userAgent);
  }, [userAgent, domReady, ref]);
  return userAgent;
}

function useMuted(
  propValue: boolean,
  ref: React.RefObject<WebviewTag>,
  domReady: boolean,
) {
  useEffect(() => {
    if (!ref.current || !domReady || propValue === ref.current.isAudioMuted())
      return;
    ref.current.setAudioMuted(propValue);
  }, [propValue, domReady, ref]);
}

function useDevTools(
  propValue: boolean,
  ref: React.RefObject<WebviewTag>,
  domReady: boolean,
) {
  useEffect(() => {
    if (
      !ref.current ||
      !domReady ||
      propValue === ref.current.isDevToolsOpened()
    )
      return;
    if (propValue) {
      ref.current.openDevTools();
    } else {
      ref.current.closeDevTools();
    }
  }, [propValue, domReady, ref]);
  // handle this in component unmount
  useLayoutEffect(() => {
    const webview = ref.current;
    return () => {
      if (webview?.isDevToolsOpened()) webview.closeDevTools();
    };
  }, [ref]);
}
