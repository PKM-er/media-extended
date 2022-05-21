//#region Reducers exports
import createReducer from "./slice";
export default createReducer;
//#endregion

export * from "./redux-sync";
export * from "./selector";
export type { RootState } from "./slice";
export { setInitInfo } from "./slice";
export * from "./slice/action";
export * from "./slice/bilibili";
export * from "./slice/controlled";
export * from "./slice/interface";
export * from "./slice/meta";
export { default as metaSlice } from "./slice/meta";
export * from "./slice/source";
export * from "./slice/status";
export * from "./slice/user-seek";
export * from "./slice/youtube";
export type { AppDispatch, AppThunk, PlayerStore } from "./utils";
export { getSubscribeFunc, observeStore, subscribe } from "./utils";
