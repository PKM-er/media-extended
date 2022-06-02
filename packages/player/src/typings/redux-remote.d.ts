import "remote-redux-devtools";

type EnhancerOptions = NonNullable<
  Exclude<import("@reduxjs/toolkit").ConfigureStoreOptions["devTools"], boolean>
>;
declare module "remote-redux-devtools" {
  interface RemoteReduxDevToolsOptions {
    maxAge?: EnhancerOptions["maxAge"];
    trace?: EnhancerOptions["trace"];
    traceLimit?: EnhancerOptions["traceLimit"];
    shouldCatchErrors?: EnhancerOptions["shouldCatchErrors"];
    shouldHotReload?: EnhancerOptions["shouldHotReload"];
    shouldRecordChanges?: EnhancerOptions["shouldRecordChanges"];
    shouldStartLocked?: EnhancerOptions["shouldStartLocked"];
    pauseActionType?: EnhancerOptions["pauseActionType"];
  }
}
