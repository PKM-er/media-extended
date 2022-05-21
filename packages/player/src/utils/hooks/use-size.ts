import useResizeObserver from "@react-hook/resize-observer";
import { useLayoutEffect, useRef, useState } from "react";

const useSize = (target: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState<DOMRectReadOnly>();

  useLayoutEffect(() => {
    target.current && setSize(target.current.getBoundingClientRect());
  }, [target]);

  // Where the magic happens
  useResizeObserver(target, (entry) => {
    setSize(entry.contentRect);
  });
  return size;
};
export default useSize;

export const useSizeRef = (target: React.RefObject<HTMLElement>) => {
  const ref = useRef<DOMRectReadOnly | null>(null);

  useLayoutEffect(() => {
    target.current && (ref.current = target.current.getBoundingClientRect());
  }, [target]);

  // Where the magic happens
  useResizeObserver(target, (entry) => {
    ref.current = entry.contentRect;
  });
  return ref;
};
