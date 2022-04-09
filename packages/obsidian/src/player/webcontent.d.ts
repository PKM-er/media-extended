// electron v17.1.1

declare namespace Electron {
  interface WebContentsEvents {
    /**
     * Emitted before dispatching the `keydown` and `keyup` events in the page. Calling
     * `event.preventDefault` will prevent the page `keydown`/`keyup` events and the
     * menu shortcuts.
     *
     * To only prevent the menu shortcuts, use `setIgnoreMenuShortcuts`:
     */
    onBeforeInputEvent: (
      event: Event,
      /**
       * Input properties.
       */
      input: Input,
    ) => void;
    /**
     * Emitted when failed to verify the `certificate` for `url`.
     *
     * The usage is the same with the `certificate-error` event of `app`.
     */
    onCertificateError: (
      event: Event,
      url: string,
      /**
       * The error code.
       */
      error: string,
      certificate: Certificate,
      callback: (isTrusted: boolean) => void,
      isMainFrame: boolean,
    ) => void;
    /**
     * Emitted when the associated window logs a console message.
     */
    onConsoleMessage: (
      event: Event,
      /**
       * The log level, from 0 to 3. In order it matches `verbose`, `info`, `warning` and
       * `error`.
       */
      level: number,
      /**
       * The actual console message
       */
      message: string,
      /**
       * The line number of the source that triggered this console message
       */
      line: number,
      sourceId: string,
    ) => void;
    /**
     * Emitted when there is a new context menu that needs to be handled.
     */
    onContextMenu: (event: Event, params: ContextMenuParams) => void;
    /**
     * Emitted when the renderer process crashes or is killed.
     *
     * **Deprecated:** This event is superceded by the `render-process-gone` event
     * which contains more information about why the render process disappeared. It
     * isn't always because it crashed.  The `killed` boolean can be replaced by
     * checking `reason === 'killed'` when you switch to that event.
     *
     * @deprecated
     */
    onCrashed: (event: Event, killed: boolean) => void;
    /**
     * Emitted when the cursor's type changes. The `type` parameter can be `default`,
     * `crosshair`, `pointer`, `text`, `wait`, `help`, `e-resize`, `n-resize`,
     * `ne-resize`, `nw-resize`, `s-resize`, `se-resize`, `sw-resize`, `w-resize`,
     * `ns-resize`, `ew-resize`, `nesw-resize`, `nwse-resize`, `col-resize`,
     * `row-resize`, `m-panning`, `e-panning`, `n-panning`, `ne-panning`, `nw-panning`,
     * `s-panning`, `se-panning`, `sw-panning`, `w-panning`, `move`, `vertical-text`,
     * `cell`, `context-menu`, `alias`, `progress`, `nodrop`, `copy`, `none`,
     * `not-allowed`, `zoom-in`, `zoom-out`, `grab`, `grabbing` or `custom`.
     *
     * If the `type` parameter is `custom`, the `image` parameter will hold the custom
     * cursor image in a `NativeImage`, and `scale`, `size` and `hotspot` will hold
     * additional information about the custom cursor.
     */
    onCursorChanged: (
      event: Event,
      type: string,
      image: NativeImage,
      /**
       * scaling factor for the custom cursor.
       */
      scale: number,
      /**
       * the size of the `image`.
       */
      size: Size,
      /**
       * coordinates of the custom cursor's hotspot.
       */
      hotspot: Point,
    ) => void;
    /**
     * Emitted when `webContents` is destroyed.
     */
    onDestroyed: Function;
    /**
     * Emitted when DevTools is closed.
     */
    onDevtoolsClosed: Function;
    /**
     * Emitted when DevTools is focused / opened.
     */
    onDevtoolsFocused: Function;
    /**
     * Emitted when DevTools is opened.
     */
    onDevtoolsOpened: Function;
    /**
     * Emitted when the devtools window instructs the webContents to reload
     */
    onDevtoolsReloadPage: Function;
    /**
     * Emitted when a `<webview>` has been attached to this web contents.
     */
    onDidAttachWebview: (
      event: Event,
      /**
       * The guest web contents that is used by the `<webview>`.
       */
      webContents: WebContents,
    ) => void;
    /**
     * Emitted when a page's theme color changes. This is usually due to encountering a
     * meta tag:
     */
    onDidChangeThemeColor: (
      event: Event,
      /**
       * Theme color is in format of '#rrggbb'. It is `null` when no theme color is set.
       */
      color: string | null,
    ) => void;
    /**
     * Emitted _after_ successful creation of a window via `window.open` in the
     * renderer. Not emitted if the creation of the window is canceled from
     * `webContents.setWindowOpenHandler`.
     *
     * See `window.open()` for more details and how to use this in conjunction with
     * `webContents.setWindowOpenHandler`.
     */
    onDidCreateWindow: (
      window: BrowserWindow,
      details: DidCreateWindowDetails,
    ) => void;
    /**
     * This event is like `did-finish-load` but emitted when the load failed. The full
     * list of error codes and their meaning is available here.
     */
    onDidFailLoad: (
      event: Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * This event is like `did-fail-load` but emitted when the load was cancelled (e.g.
     * `window.stop()` was invoked).
     */
    onDidFailProvisionalLoad: (
      event: Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Emitted when the navigation is done, i.e. the spinner of the tab has stopped
     * spinning, and the `onload` event was dispatched.
     */
    onDidFinishLoad: Function;
    /**
     * Emitted when a frame has done navigation.
     */
    onDidFrameFinishLoad: (
      event: Event,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Emitted when any frame navigation is done.
     *
     * This event is not emitted for in-page navigations, such as clicking anchor links
     * or updating the `window.location.hash`. Use `did-navigate-in-page` event for
     * this purpose.
     */
    onDidFrameNavigate: (
      event: Event,
      url: string,
      /**
       * -1 for non HTTP navigations
       */
      httpResponseCode: number,
      /**
       * empty for non HTTP navigations,
       */
      httpStatusText: string,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Emitted when a main frame navigation is done.
     *
     * This event is not emitted for in-page navigations, such as clicking anchor links
     * or updating the `window.location.hash`. Use `did-navigate-in-page` event for
     * this purpose.
     */
    onDidNavigate: (
      event: Event,
      url: string,
      /**
       * -1 for non HTTP navigations
       */
      httpResponseCode: number,
      /**
       * empty for non HTTP navigations
       */
      httpStatusText: string,
    ) => void;
    /**
     * Emitted when an in-page navigation happened in any frame.
     *
     * When in-page navigation happens, the page URL changes but does not cause
     * navigation outside of the page. Examples of this occurring are when anchor links
     * are clicked or when the DOM `hashchange` event is triggered.
     */
    onDidNavigateInPage: (
      event: Event,
      url: string,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Emitted after a server side redirect occurs during navigation.  For example a
     * 302 redirect.
     *
     * This event cannot be prevented, if you want to prevent redirects you should
     * checkout out the `will-redirect` event above.
     */
    onDidRedirectNavigation: (
      event: Event,
      url: string,
      isInPlace: boolean,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Corresponds to the points in time when the spinner of the tab started spinning.
     */
    onDidStartLoading: Function;
    /**
     * Emitted when any frame (including main) starts navigating. `isInPlace` will be
     * `true` for in-page navigations.
     */
    onDidStartNavigation: (
      event: Event,
      url: string,
      isInPlace: boolean,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Corresponds to the points in time when the spinner of the tab stopped spinning.
     */
    onDidStopLoading: Function;
    /**
     * Emitted when the document in the top-level frame is loaded.
     */
    onDomReady: (event: Event) => void;
    /**
     * Emitted when the window enters a full-screen state triggered by HTML API.
     */
    onEnterHtmlFullScreen: Function;
    /**
     * Emitted when a result is available for [`webContents.findInPage`] request.
     */
    onFoundInPage: (event: Event, result: Result) => void;
    /**
     * Emitted when the mainFrame, an `<iframe>`, or a nested `<iframe>` is loaded
     * within the page.
     */
    onFrameCreated: (event: Event, details: FrameCreatedDetails) => void;
    /**
     * Emitted when the renderer process sends an asynchronous message via
     * `ipcRenderer.send()`.
     */
    onIpcMessage: (event: Event, channel: string, ...args: any[]) => void;
    /**
     * Emitted when the renderer process sends a synchronous message via
     * `ipcRenderer.sendSync()`.
     */
    onIpcMessageSync: (event: Event, channel: string, ...args: any[]) => void;
    /**
     * Emitted when the window leaves a full-screen state triggered by HTML API.
     */
    onLeaveHtmlFullScreen: Function;
    /**
     * Emitted when `webContents` wants to do basic auth.
     *
     * The usage is the same with the `login` event of `app`.
     */
    onLogin: (
      event: Event,
      authenticationResponseDetails: AuthenticationResponseDetails,
      authInfo: AuthInfo,
      callback: (username?: string, password?: string) => void,
    ) => void;
    /**
     * Emitted when media is paused or done playing.
     */
    onMediaPaused: Function;
    /**
     * Emitted when media starts playing.
     */
    onMediaStartedPlaying: Function;
    /**
     * Deprecated in favor of `webContents.setWindowOpenHandler`.
     *
     * Emitted when the page requests to open a new window for a `url`. It could be
     * requested by `window.open` or an external link like `<a target='_blank'>`.
     *
     * By default a new `BrowserWindow` will be created for the `url`.
     *
     * Calling `event.preventDefault()` will prevent Electron from automatically
     * creating a new `BrowserWindow`. If you call `event.preventDefault()` and
     * manually create a new `BrowserWindow` then you must set `event.newGuest` to
     * reference the new `BrowserWindow` instance, failing to do so may result in
     * unexpected behavior. For example:
     *
     * @deprecated
     */
    onNewWindow: (
      event: NewWindowWebContentsEvent,
      url: string,
      frameName: string,
      /**
       * Can be `default`, `foreground-tab`, `background-tab`, `new-window`,
       * `save-to-disk` and `other`.
       */
      disposition:
        | "default"
        | "foreground-tab"
        | "background-tab"
        | "new-window"
        | "save-to-disk"
        | "other",
      /**
       * The options which will be used for creating the new `BrowserWindow`.
       */
      options: BrowserWindowConstructorOptions,
      /**
       * The non-standard features (features not handled by Chromium or Electron) given
       * to `window.open()`. Deprecated, and will now always be the empty array `[]`.
       */
      additionalFeatures: string[],
      /**
       * The referrer that will be passed to the new window. May or may not result in the
       * `Referer` header being sent, depending on the referrer policy.
       */
      referrer: Referrer,
      /**
       * The post data that will be sent to the new window, along with the appropriate
       * headers that will be set. If no post data is to be sent, the value will be
       * `null`. Only defined when the window is being created by a form that set
       * `target=_blank`.
       */
      postBody: PostBody,
    ) => void;
    /**
     * Emitted when page receives favicon urls.
     */
    onPageFaviconUpdated: (
      event: Event,
      /**
       * Array of URLs.
       */
      favicons: string[],
    ) => void;
    /**
     * Fired when page title is set during navigation. `explicitSet` is false when
     * title is synthesized from file url.
     */
    onPageTitleUpdated: (
      event: Event,
      title: string,
      explicitSet: boolean,
    ) => void;
    /**
     * Emitted when a new frame is generated. Only the dirty area is passed in the
     * buffer.
     */
    onPaint: (
      event: Event,
      dirtyRect: Rectangle,
      /**
       * The image data of the whole frame.
       */
      image: NativeImage,
    ) => void;
    /**
     * Emitted when a plugin process has crashed.
     */
    onPluginCrashed: (event: Event, name: string, version: string) => void;
    /**
     * Emitted when the `WebContents` preferred size has changed.
     *
     * This event will only be emitted when `enablePreferredSizeMode` is set to `true`
     * in `webPreferences`.
     */
    onPreferredSizeChanged: (
      event: Event,
      /**
       * The minimum size needed to contain the layout of the document—without requiring
       * scrolling.
       */
      preferredSize: Size,
    ) => void;
    /**
     * Emitted when the preload script `preloadPath` throws an unhandled exception
     * `error`.
     */
    onPreloadError: (event: Event, preloadPath: string, error: Error) => void;
    /**
     * Emitted when the renderer process unexpectedly disappears.  This is normally
     * because it was crashed or killed.
     */
    onRenderProcessGone: (
      event: Event,
      details: RenderProcessGoneDetails,
    ) => void;
    /**
     * Emitted when the unresponsive web page becomes responsive again.
     */
    onResponsive: Function;
    /**
     * Emitted when bluetooth device needs to be selected on call to
     * `navigator.bluetooth.requestDevice`. To use `navigator.bluetooth` api
     * `webBluetooth` should be enabled. If `event.preventDefault` is not called, first
     * available device will be selected. `callback` should be called with `deviceId`
     * to be selected, passing empty string to `callback` will cancel the request.
     *
     * If no event listener is added for this event, all bluetooth requests will be
     * cancelled.
     */
    onSelectBluetoothDevice: (
      event: Event,
      devices: BluetoothDevice[],
      callback: (deviceId: string) => void,
    ) => void;
    /**
     * Emitted when a client certificate is requested.
     *
     * The usage is the same with the `select-client-certificate` event of `app`.
     */
    onSelectClientCertificate: (
      event: Event,
      url: string,
      certificateList: Certificate[],
      callback: (certificate: Certificate) => void,
    ) => void;
    /**
     * Emitted when the web page becomes unresponsive.
     */
    onUnresponsive: Function;
    /**
     * Emitted when mouse moves over a link or the keyboard moves the focus to a link.
     */
    onUpdateTargetUrl: (event: Event, url: string) => void;
    /**
     * Emitted when a `<webview>`'s web contents is being attached to this web
     * contents. Calling `event.preventDefault()` will destroy the guest page.
     *
     * This event can be used to configure `webPreferences` for the `webContents` of a
     * `<webview>` before it's loaded, and provides the ability to set settings that
     * can't be set via `<webview>` attributes.
     *
     * **Note:** The specified `preload` script option will appear as `preloadURL` (not
     * `preload`) in the `webPreferences` object emitted with this event.
     */
    onWillAttachWebview: (
      event: Event,
      /**
       * The web preferences that will be used by the guest page. This object can be
       * modified to adjust the preferences for the guest page.
       */
      webPreferences: WebPreferences,
      /**
       * The other `<webview>` parameters such as the `src` URL. This object can be
       * modified to adjust the parameters of the guest page.
       */
      params: Record<string, string>,
    ) => void;
    /**
     * Emitted when a user or the page wants to start navigation. It can happen when
     * the `window.location` object is changed or a user clicks a link in the page.
     *
     * This event will not emit when the navigation is started programmatically with
     * APIs like `webContents.loadURL` and `webContents.back`.
     *
     * It is also not emitted for in-page navigations, such as clicking anchor links or
     * updating the `window.location.hash`. Use `did-navigate-in-page` event for this
     * purpose.
     *
     * Calling `event.preventDefault()` will prevent the navigation.
     */
    onWillNavigate: (event: Event, url: string) => void;
    /**
     * Emitted when a `beforeunload` event handler is attempting to cancel a page
     * unload.
     *
     * Calling `event.preventDefault()` will ignore the `beforeunload` event handler
     * and allow the page to be unloaded.
     *
     * **Note:** This will be emitted for `BrowserViews` but will _not_ be respected -
     * this is because we have chosen not to tie the `BrowserView` lifecycle to its
     * owning BrowserWindow should one exist per the specification.
     */
    onWillPreventUnload: (event: Event) => void;
    /**
     * Emitted as a server side redirect occurs during navigation.  For example a 302
     * redirect.
     *
     * This event will be emitted after `did-start-navigation` and always before the
     * `did-redirect-navigation` event for the same navigation.
     *
     * Calling `event.preventDefault()` will prevent the navigation (not just the
     * redirect).
     */
    onWillRedirect: (
      event: Event,
      url: string,
      isInPlace: boolean,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => void;
    /**
     * Emitted when the user is requesting to change the zoom level using the mouse
     * wheel.
     */
    onZoomChanged: (
      event: Event,
      /**
       * Can be `in` or `out`.
       */
      zoomDirection: "in" | "out",
    ) => void;
  }
}
