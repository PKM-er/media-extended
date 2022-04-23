import { AppDispatch, RootState } from "@player/store";
import { getBuffered } from "@player/utils/get-buffered";
import { handleProgress } from "@slice/controls";
import { setRatio } from "@slice/interface";
import { Source } from "@slice/provider/types";

export const updateRatio = (
  player: HTMLMediaElement,
  dispatch: (action: Parameters<AppDispatch>[0]) => unknown,
) => {
  if (player instanceof HTMLVideoElement) {
    const { videoWidth, videoHeight } = player;
    if (videoHeight && videoWidth) {
      dispatch(setRatio([videoWidth, videoHeight]));
    }
  }
};

export const updateBufferH5 = (
  player: HTMLMediaElement,
  dispatch: (action: Parameters<AppDispatch>[0]) => unknown,
) => {
  const buffered = getBuffered(player);
  buffered && dispatch(handleProgress({ buffered, duration: player.duration }));
};
export const updateBufferYtb = (
  player: YT.Player,
  dispatch: AppDispatch,
  duration: number | null,
) => {
  const fraction = player.getVideoLoadedFraction();
  duration = duration || player.getDuration();
  typeof fraction === "number" &&
    duration &&
    dispatch(handleProgress({ buffered: fraction * duration, duration }));
};

export const selectFrag = (state: RootState) => state.controls.fragment,
  selectLoop = (state: RootState) => state.controls.loop,
  selectDuration = (state: RootState) => state.controls.duration,
  selectVolumeMute = (state: RootState): [muted: boolean, volume: number] => [
    state.controls.muted,
    state.controls.volume,
  ],
  selectYtbResetProp = (state: RootState) => [
    state.controls.autoplay,
    state.interface.controls === "native",
  ],
  selectShouldLoadResource = (
    state: RootState,
  ): [
    player: Source["playerType"] | undefined,
    src: Source["src"] | undefined,
  ] => [state.provider.source?.playerType, state.provider.source?.src];
