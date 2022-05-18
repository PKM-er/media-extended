export type { RootState } from "./slice";
export { setPlatform } from "./slice";
export type { AppDispatch, AppThunk, PlayerStore } from "./utils";

//#region Reducers exports
import createReducer from "./slice";
export default createReducer;
//#endregion

export * from "./selector";
export { getSubscribeFunc, observeStore, subscribe } from "./utils";
