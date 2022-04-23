import { controlsSlice } from "./slice";

export { LARGE_CURRENT_TIME } from "./slice";

export const {
  setFragment,
  reset,
  play,
  pause,
  togglePlay,
  unlockPlayPauseEvent,
  setFullscreen,
  toggleFullscreen,
  setMute,
  toggleMute,
  handleLoopChange,
  handleAutoplayChange,
  setVolume,
  setVolumeUnmute,
  updateBasicInfo,
  dragSeek,
  dragSeekEnd,
  progressBarSeek,
  progressBarSeekEnd,
  handleTimeUpdate,
  handleFullscreenChange,
  handleVolumeChange,
  handleDurationChange,
  revertDuration,
  handleSeeking,
  handleSeeked,
  handlePlaying,
  handlePause,
  handleRateChange,
  handleProgress,
  handleEnded,
  handleWaiting,
  handleError,
} = controlsSlice.actions;

export default controlsSlice.reducer;
