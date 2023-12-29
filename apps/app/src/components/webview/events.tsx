import { useEffect } from "react";

export const WebviewEventsMap = {
  onLoadCommit: "load-commit",
  onDidFinishLoad: "did-finish-load",
  onDidFailLoad: "did-fail-load",
  onDidFrameFinishLoad: "did-frame-finish-load",
  onDidStartLoading: "did-start-loading",
  onDidStopLoading: "did-stop-loading",
  onDidAttach: "did-attach",
  onDomReady: "dom-ready",
  onPageTitleUpdated: "page-title-updated",
  onPageFaviconUpdated: "page-favicon-updated",
  onEnterHtmlFullScreen: "enter-html-full-screen",
  onLeaveHtmlFullScreen: "leave-html-full-screen",
  onConsoleMessage: "console-message",
  onFoundInPage: "found-in-page",
  onWillNavigate: "will-navigate",
  onDidStartNavigation: "did-start-navigation",
  onDidRedirectNavigation: "did-redirect-navigation",
  onDidNavigate: "did-navigate",
  onDidFrameNavigate: "did-frame-navigate",
  onDidNavigateInPage: "did-navigate-in-page",
  onClose: "close",
  onIpcMessage: "ipc-message",
  onCrashed: "crashed",
  onPluginCrashed: "plugin-crashed",
  onDestroyed: "destroyed",
  onMediaStartedPlaying: "media-started-playing",
  onMediaPaused: "media-paused",
  onDidChangeThemeColor: "did-change-theme-color",
  onUpdateTargetUrl: "update-target-url",
  onDevtoolsOpened: "devtools-opened",
  onDevtoolsClosed: "devtools-closed",
  onDevtoolsFocused: "devtools-focused",
  onContextMenu: "context-menu",
} satisfies Record<keyof WebviewEvents, string>;

interface WebviewEvents {
  onLoadCommit: Electron.LoadCommitEvent;
  onDidFinishLoad: Electron.Event;
  onDidFailLoad: Electron.DidFailLoadEvent;
  onDidFrameFinishLoad: Electron.DidFrameFinishLoadEvent;
  onDidStartLoading: Electron.Event;
  onDidStopLoading: Electron.Event;
  onDidAttach: Electron.Event;
  onDomReady: Electron.Event;
  onPageTitleUpdated: Electron.PageTitleUpdatedEvent;
  onPageFaviconUpdated: Electron.PageFaviconUpdatedEvent;
  onEnterHtmlFullScreen: Electron.Event;
  onLeaveHtmlFullScreen: Electron.Event;
  onConsoleMessage: Electron.ConsoleMessageEvent;
  onFoundInPage: Electron.FoundInPageEvent;
  onWillNavigate: Electron.WillNavigateEvent;
  onDidStartNavigation: Electron.DidStartNavigationEvent;
  onDidRedirectNavigation: Electron.DidRedirectNavigationEvent;
  onDidNavigate: Electron.DidNavigateEvent;
  onDidFrameNavigate: Electron.DidFrameNavigateEvent;
  onDidNavigateInPage: Electron.DidNavigateInPageEvent;
  onClose: Electron.Event;
  onIpcMessage: Electron.IpcMessageEvent;
  onCrashed: Electron.Event;
  onPluginCrashed: Electron.PluginCrashedEvent;
  onDestroyed: Electron.Event;
  onMediaStartedPlaying: Electron.Event;
  onMediaPaused: Electron.Event;
  onDidChangeThemeColor: Electron.DidChangeThemeColorEvent;
  onUpdateTargetUrl: Electron.UpdateTargetUrlEvent;
  onDevtoolsOpened: Electron.Event;
  onDevtoolsClosed: Electron.Event;
  onDevtoolsFocused: Electron.Event;
  onContextMenu: Electron.ContextMenuEvent;
}

export type WebviewEventProps = Partial<{
  [K in keyof WebviewEvents]: (event: WebviewEvents[K]) => void;
}>;

function pickEvents<P extends WebviewEventProps>(props: P) {
  type RestProps = Omit<P, keyof WebviewEvents>;
  return Object.entries(props).reduce(
    (acc, [key, value]) => {
      if (key in WebviewEventsMap) {
        acc.event[key as keyof WebviewEventProps] = value as any;
      } else {
        acc.rest[key as keyof RestProps] = value as any;
      }
      return acc;
    },
    {
      event: {},
      rest: {},
    } as {
      event: WebviewEventProps;
      rest: RestProps;
    },
  );
}

export function useEvents<P extends WebviewEventProps>(
  props: P,
  ref: React.RefObject<Electron.WebviewTag>,
) {
  const { event, rest } = pickEvents(props);
  for (const k of Object.keys(WebviewEventsMap)) {
    const propName = k as keyof typeof WebviewEventsMap,
      eventName = WebviewEventsMap[propName];

    const handler = event[propName] as any;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!ref.current || !handler) return;

      const element = ref.current;
      element.addEventListener(eventName, handler);
      return () => {
        element.removeEventListener(eventName, handler);
      };
    }, [eventName, handler, ref]);
  }
  return rest;
}
