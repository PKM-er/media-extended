//#region selector exports
import type { RootState } from "./slice";
import { Controls } from "./slice/interface";
import { isHTMLMediaSource, PlayerType } from "./slice/source/types";

export const selectPlayerType = (state: RootState) => state.source.type,
  selectAllowCORS = (state: RootState) => {
    if (isHTMLMediaSource(state.source)) return state.source.allowCORS;
    else return true;
  },
  selectFrag = (state: RootState) => state.controlled.fragment,
  selectLoop = (state: RootState) => state.controlled.loop,
  selectVolumeMute = (state: RootState): [muted: boolean, volume: number] => [
    state.controlled.muted,
    state.controlled.volume,
  ],
  selectSpeed = (state: RootState) => state.controlled.playbackRate,
  selectAutoplay = (state: RootState) => state.controlled.autoplay,
  selectPaused = (state: RootState) => state.controlled.paused;
export const selectIsIOS = (state: RootState) =>
  state.platform ? state.platform === "safari" : null;
export const selectScreenshotRequested = (state: RootState) =>
    state.action.getScreenshot === true,
  selectScreenshotSupported = (state: RootState) =>
    state.action.getScreenshot !== null,
  selectTimestampRequested = (state: RootState) =>
    state.action.getTimestamp === true;
export const selectCurrentTime = ({ status }: RootState) => status.currentTime,
  selectDuration = ({ status }: RootState) => status.duration,
  selectBuffered = ({ status }: RootState) => status.buffered;
export const selectFscreen = (state: RootState) => state.interface.fullscreen;
export const selectIsCustomControls = (state: RootState) =>
    state.interface.controls === Controls.custom,
  selectIsNativeControls = (state: RootState) =>
    state.interface.controls === Controls.native;

export const selectHTMLSrc = (state: RootState) =>
    isHTMLMediaSource(state.source) ? state.source.src : null,
  selectTracks = (state: RootState) =>
    state.source.type === PlayerType.video ? state.source.tracks : null,
  selectHTMLPlayerType = (state: RootState) => {
    if (isHTMLMediaSource(state.source)) {
      const { type } = state.source;
      if (type === PlayerType.unknown) return PlayerType.video;
      else return type;
    } else return null;
  };
//#region
