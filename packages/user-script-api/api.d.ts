import type * as _Selectors from "mx-store/src/selector";
import type * as _Slices from "mx-store/src/slice";
import type { AppDispatch, getSubscribeFunc, RootState } from "mx-store";
/**
 * @returns unregister function
 */
export function registerPlayer(
  player: HTMLVideoElement | HTMLAudioElement | HTMLMediaElement
): () => void;

export const dispatch: AppDispatch;
export const subscribe: ReturnType<typeof getSubscribeFunc>;
export function getState(): RootState;
export const handle: EvtEmitter["on"];

export const Selectors: typeof _Selectors;
export const Slices: typeof _Slices;
export { RootState };
