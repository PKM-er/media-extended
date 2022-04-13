export type BrowserViewRef =
  React.MutableRefObject<Electron.BrowserView | null>;

export type DevToolsMode = "left" | "right" | "bottom" | "undocked" | "detach";

export const WebContensEventsMap = {
  onBeforeInputEvent: "before-input-event",
  onCertificateError: "certificate-error",
  onConsoleMessage: "console-message",
  onContextMenu: "context-menu",
  onCrashed: "crashed",
  onCursorChanged: "cursor-changed",
  onDestroyed: "destroyed",
  onDevtoolsClosed: "devtools-closed",
  onDevtoolsFocused: "devtools-focused",
  onDevtoolsOpened: "devtools-opened",
  onDevtoolsReloadPage: "devtools-reload-page",
  onDidAttachWebview: "did-attach-webview",
  onDidChangeThemeColor: "did-change-theme-color",
  onDidCreateWindow: "did-create-window",
  onDidFailLoad: "did-fail-load",
  onDidFailProvisionalLoad: "did-fail-provisional-load",
  onDidFinishLoad: "did-finish-load",
  onDidFrameFinishLoad: "did-frame-finish-load",
  onDidFrameNavigate: "did-frame-navigate",
  onDidNavigate: "did-navigate",
  onDidNavigateInPage: "did-navigate-in-page",
  onDidRedirectNavigation: "did-redirect-navigation",
  onDidStartLoading: "did-start-loading",
  onDidStartNavigation: "did-start-navigation",
  onDidStopLoading: "did-stop-loading",
  onDomReady: "dom-ready",
  onEnterHtmlFullScreen: "enter-html-full-screen",
  onFoundInPage: "found-in-page",
  onFrameCreated: "frame-created",
  onIpcMessage: "ipc-message",
  onIpcMessageSync: "ipc-message-sync",
  onLeaveHtmlFullScreen: "leave-html-full-screen",
  onLogin: "login",
  onMediaPaused: "media-paused",
  onMediaStartedPlaying: "media-started-playing",
  onNewWindow: "new-window",
  onPageFaviconUpdated: "page-favicon-updated",
  onPageTitleUpdated: "page-title-updated",
  onPaint: "paint",
  onPluginCrashed: "plugin-crashed",
  onPreferredSizeChanged: "preferred-size-changed",
  onPreloadError: "preload-error",
  onRenderProcessGone: "render-process-gone",
  onResponsive: "responsive",
  onSelectBluetoothDevice: "select-bluetooth-device",
  onSelectClientCertificate: "select-client-certificate",
  onUnresponsive: "unresponsive",
  onUpdateTargetUrl: "update-target-url",
  onWillAttachWebview: "will-attach-webview",
  onWillNavigate: "will-navigate",
  onWillPreventUnload: "will-prevent-unload",
  onWillRedirect: "will-redirect",
  onZoomChanged: "zoom-changed",
} as const;

export type WebContentsEventProps = {
  [K in keyof Electron.WebContentsEvents]: (
    event: Electron.WebContentsEvents[K],
  ) => void;
};

// https://www.electronjs.org/docs/api/structures/rectangle
export const getElectronRect = (rect: Electron.Rectangle) => {
  // Properties in the returned DOMRect object are not own properties.
  // While the in operator and for...in will find returned properties,
  // other APIs such as Object.keys() will fail. Moreover, and unexpectedly,
  // the ES2015 and newer features such as Object.assign() and object rest/spread
  // will fail to copy returned properties.
  return (["x", "y", "width", "height"] as const).reduce((eRect, key) => {
    // Electron.Rectangle only accept integer
    eRect[key] = Math.round(rect[key]);
    return eRect;
  }, {} as any) as Electron.Rectangle;
};
export const destroyView = (
  view: Electron.BrowserView,
  win: Electron.BrowserWindow,
) => {
  win.removeBrowserView(view);
  // https://github.com/electron/electron/issues/10096
  (view.webContents as any).destroy();
};

export const hideView = (view: Electron.BrowserView) => {
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
};
