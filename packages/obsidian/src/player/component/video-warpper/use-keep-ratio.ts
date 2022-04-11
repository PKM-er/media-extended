import useResizeObserver from "@react-hook/resize-observer";
import { useLayoutEffect, useState } from "react";

import { useAppSelector } from "../../hooks";

const useKeepRatio = (
  container: React.RefObject<HTMLElement>,
): "width" | "height" | undefined => {
  const [size, setSize] = useState<DOMRectReadOnly>();

  useLayoutEffect(() => {
    container.current && setSize(container.current.getBoundingClientRect());
  }, [container]);

  // Where the magic happens
  useResizeObserver(container, (entry) => {
    console.log("obs", entry.contentRect);
    setSize(entry.contentRect);
  });

  const ratio = useAppSelector((state) => {
    const ratio = state.interface.ratio;
    if (!ratio) return null;
    const [width, height] = ratio.split("/");
    return +width / +height;
  });
  const containerRatio = size ? size.width / size.height : null;
  if (ratio && containerRatio) {
    return ratio >= containerRatio ? "width" : "height";
  } else return undefined;
};
export default useKeepRatio;
