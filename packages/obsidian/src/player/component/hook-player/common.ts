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

export const updateBuffer = (
  player: HTMLMediaElement,
  dispatch: (action: Parameters<AppDispatch>[0]) => unknown,
) => {
  const buffered = getBuffered(player);
  buffered && dispatch(handleProgress({ buffered, duration: player.duration }));
};

export const selectFrag = (state: RootState) => state.controls.fragment,
  selectVolumeMute = (state: RootState): [muted: boolean, volume: number] => [
    state.controls.muted,
    state.controls.volume,
  ],
  selectShouldLoadResource = (
    state: RootState,
  ): [
    player: Source["playerType"] | undefined,
    src: Source["src"] | undefined,
  ] => [state.provider.source?.playerType, state.provider.source?.src];
