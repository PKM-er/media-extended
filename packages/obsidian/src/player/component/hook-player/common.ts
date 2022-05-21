import { getBuffered } from "@player/utils/get-buffered";
import { setRatio } from "mx-store";
import { handleProgress } from "mx-store";
import { AppDispatch, RootState, selectIsNativeControls } from "mx-store";

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

export const selectYtbResetProp = (state: RootState) =>
    [state.controlled.autoplay, selectIsNativeControls(state)] as const,
  selectShouldLoadResource = ({ source }: RootState) =>
    [source.type, source.src] as const;
