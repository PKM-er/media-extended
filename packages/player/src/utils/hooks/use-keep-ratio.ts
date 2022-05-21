import { useAppSelector } from "@store-hooks";

import { useSize } from ".";

const useKeepRatio = (
  container: React.RefObject<HTMLElement>,
): "width" | "height" => {
  const size = useSize(container),
    videoRatio = useAppSelector((state) => {
      const ratio = state.interface.ratio;
      if (ratio === null) return 16 / 9;
      if (ratio === 0) return Infinity;
      const [width, height] = ratio.split("/");
      return +width / +height;
    });

  const containerRatio = size ? size.width / size.height : null;
  if (containerRatio) {
    return videoRatio >= containerRatio ? "width" : "height";
  } else return "width";
};
export default useKeepRatio;
