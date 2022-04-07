import { useUnmount } from "ahooks";
import equal from "fast-deep-equal/es6";
import { DependencyList, EffectCallback, useEffect, useRef } from "react";

// electron v17.1.1
interface ElectronWebviewEvents {
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
  onNewWindow: Electron.NewWindowEvent;
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
export const ElectronWebviewEventsMap = {
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
  onNewWindow: "new-window",
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
} as const;

export type ElectronWebviewEventProps = {
  [K in keyof ElectronWebviewEvents]: (event: ElectronWebviewEvents[K]) => void;
};

/**
 *
 * @param effect
 * @param deps
 * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
 */
export const useEffectWithTarget = (
  effect: EffectCallback,
  deps: DependencyList,
  target: React.MutableRefObject<Electron.WebviewTag | null>,
) => {
  const hasInitRef = useRef(false);

  const lastElementRef = useRef<Element | null>();
  const lastDepsRef = useRef<DependencyList>([]);

  const unLoadRef = useRef<any>();

  useEffect(() => {
    const el = target.current;

    // init run
    if (!hasInitRef.current) {
      hasInitRef.current = true;
      lastElementRef.current = el;
      lastDepsRef.current = deps;

      unLoadRef.current = effect();
      return;
    }

    if (el !== lastElementRef.current || !equal(deps, lastDepsRef.current)) {
      unLoadRef.current?.();

      lastElementRef.current = el;
      lastDepsRef.current = deps;
      unLoadRef.current = effect();
    }
  });

  useUnmount(() => {
    unLoadRef.current?.();
    // for react-refresh
    hasInitRef.current = false;
  });
};
