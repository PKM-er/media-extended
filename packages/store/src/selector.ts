import { RootState } from "./slice";
import { Controls } from "./slice/player/slice/interface";
import { isHTMLMediaState, PlayerType } from "./slice/player/typings";

export const selectPlayerType = (state: RootState) => state.player.type,
  selectAllowCORS = (state: RootState) => {
    if (isHTMLMediaState(state.player)) return state.player.source.allowCORS;
    else return true;
  },
  selectFrag = (state: RootState) => state.player.status?.fragment,
  selectLoop = (state: RootState) => state.player.status?.loop,
  selectVolumeMute = (
    state: RootState,
  ):
    | [muted: boolean, volume: number]
    | [muted: undefined, volume: undefined] => {
    if (state.player.status) {
      const { muted, volume } = state.player.status;
      return [muted, volume];
    } else return [undefined, undefined];
  },
  selectMuted = (state: RootState) => state.player.status?.muted,
  selectSpeed = (state: RootState) => state.player.status?.playbackRate,
  selectAutoplay = (state: RootState) => state.player.status?.autoplay,
  selectPaused = (state: RootState) => state.player.status?.paused,
  selectSeeking = (state: RootState) => state.player.status?.seeking,
  selectHasStarted = (state: RootState) => state.player.status?.hasStarted;
export const selectIsIOS = (state: RootState) =>
  state.basic.platform ? state.basic.platform === "safari" : null;
export const selectScreenshotRequested = (state: RootState) =>
    state.player.action.getScreenshot === true,
  selectScreenshotSupported = (state: RootState) =>
    state.player.action.getScreenshot !== null,
  selectTimestampRequested = (state: RootState) =>
    state.player.action.getTimestamp === true;
export const selectCurrentTime = ({ player }: RootState) =>
    player.status?.currentTime,
  selectDuration = ({ player }: RootState) => player.status?.duration,
  selectTimeDuration = (
    state: RootState,
  ):
    | [currentTime: number, duration: number | null]
    | [currentTime: undefined, duration: undefined] => {
    if (state.player.status) {
      const { currentTime, duration } = state.player.status;
      return [currentTime, duration];
    } else return [undefined, undefined];
  },
  selectBuffered = ({ player }: RootState) => player.status?.buffered;
export const selectFscreen = (state: RootState) =>
  state.player.interface.fullscreen;
export const selectIsCustomControls = (state: RootState) =>
    state.player.interface.controls === Controls.custom,
  selectIsNativeControls = (state: RootState) =>
    state.player.interface.controls === Controls.native,
  selectError = ({ player }: RootState) => player.status?.error;

export const selectHTMLSrc = (state: RootState) =>
    isHTMLMediaState(state.player) ? state.player.source.src : null,
  selectBilibiliSrc = (state: RootState) =>
    state.player.type === PlayerType.bilibili ? state.player.source.src : null,
  selectTracks = (state: RootState) =>
    state.player.type === PlayerType.video ? state.player.source.tracks : null,
  selectHTMLPlayerType = (state: RootState) => {
    if (isHTMLMediaState(state.player)) {
      const { type } = state.player;
      if (type === PlayerType.unknown) return PlayerType.video;
      else return type;
    } else return null;
  },
  selectMediaSource = (state: RootState) => state.player.source,
  selectActiveCues = (state: RootState) => state.player.interface.activeCues,
  selectTextTracks = (state: RootState) => state.player.interface.textTracks;
export const selectFilter = (state: RootState) => state.player.interface.filter,
  selectRatio = (state: RootState) => state.player.interface.ratio;
export const selectUserSeek = (state: RootState) => state.player.userSeek,
  selectUserSeeking = (state: RootState) => !!state.player.userSeek;

export const selectYoutubeAPIReady = (state: RootState) =>
    state.player.type === PlayerType.youtubeAPI &&
    state.player.status.YTAPIStatus === "ready",
  selectDanmaku = (state: RootState) =>
    state.player.type === PlayerType.bilibili
      ? state.player.status.danmaku
      : null,
  selectBiliWebFscreen = (state: RootState) =>
    state.player.type === PlayerType.bilibili
      ? state.player.status.webFscreen
      : null;

export const selectMeta = (state: RootState) => state.player.meta,
  selectProvider = (state: RootState) => state.player.meta?.provider,
  selectTitle = (state: RootState) => state.player.meta?.title;

export const selectLanguage = (state: RootState) => state.basic.language;

export const selectYoutubeProps = (state: RootState) => ({
  language: selectLanguage(state),
  mute: selectMuted(state) === true,
  autoplay: selectAutoplay(state) === true,
  loop: selectLoop(state) === true,
  controls: selectIsNativeControls(state),
});
