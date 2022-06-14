//#region selector exports
import type { RootState } from "./slice";
import { Controls } from "./slice/player/interface";
import { isHTMLMediaSource, PlayerType } from "./slice/player/source/types";

export const selectPlayerType = (state: RootState) => state.player.source.type,
  selectAllowCORS = (state: RootState) => {
    if (isHTMLMediaSource(state.player.source))
      return state.player.source.allowCORS;
    else return true;
  },
  selectFrag = (state: RootState) => state.player.status.fragment,
  selectLoop = (state: RootState) => state.player.status.loop,
  selectVolumeMute = (state: RootState): [muted: boolean, volume: number] => [
    state.player.status.muted,
    state.player.status.volume,
  ],
  selectSpeed = (state: RootState) => state.player.status.playbackRate,
  selectAutoplay = (state: RootState) => state.player.status.autoplay,
  selectPaused = (state: RootState) => state.player.status.paused;
export const selectIsIOS = (state: RootState) =>
  state.basic.platform ? state.basic.platform === "safari" : null;
export const selectScreenshotRequested = (state: RootState) =>
    state.player.action.getScreenshot === true,
  selectScreenshotSupported = (state: RootState) =>
    state.player.action.getScreenshot !== null,
  selectTimestampRequested = (state: RootState) =>
    state.player.action.getTimestamp === true;
export const selectCurrentTime = ({ player }: RootState) =>
    player.status.currentTime,
  selectDuration = ({ player }: RootState) => player.status.duration,
  selectBuffered = ({ player }: RootState) => player.status.buffered;
export const selectFscreen = (state: RootState) =>
  state.player.interface.fullscreen;
export const selectIsCustomControls = (state: RootState) =>
    state.player.interface.controls === Controls.custom,
  selectIsNativeControls = (state: RootState) =>
    state.player.interface.controls === Controls.native;

export const selectHTMLSrc = (state: RootState) =>
    isHTMLMediaSource(state.player.source) ? state.player.source.src : null,
  selectTracks = (state: RootState) =>
    state.player.source.type === PlayerType.video
      ? state.player.source.tracks
      : null,
  selectHTMLPlayerType = (state: RootState) => {
    if (isHTMLMediaSource(state.player.source)) {
      const { type } = state.player.source;
      if (type === PlayerType.unknown) return PlayerType.video;
      else return type;
    } else return null;
  };
//#region
