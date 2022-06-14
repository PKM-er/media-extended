//#region Reducers exports
import createReducer from "./slice";
export default createReducer;
//#endregion

export * from "./redux-sync";
export * from "./selector";
export * from "./slice";
export type { AppDispatch, AppThunk, PlayerStore } from "./utils";
export { getSubscribeFunc, observeStore, subscribe } from "./utils";
