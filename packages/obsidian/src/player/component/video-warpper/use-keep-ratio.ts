import { useSize } from "@hook-utils";
import { useAppSelector } from "@player/hooks";

const useKeepRatio = (
  container: React.RefObject<HTMLElement>,
): "width" | "height" | undefined => {
  const size = useSize(container),
    videoRatio = useAppSelector((state) => {
      const ratio = state.interface.ratio;
      if (!ratio) return null;
      const [width, height] = ratio.split("/");
      return +width / +height;
    });

  const containerRatio = size ? size.width / size.height : null;
  if (videoRatio && containerRatio) {
    return videoRatio >= containerRatio ? "width" : "height";
  } else return undefined;
};
export default useKeepRatio;
