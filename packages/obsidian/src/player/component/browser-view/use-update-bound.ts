import useResizeObserver from "@react-hook/resize-observer";
import { useLatest } from "ahooks";
import { debounce } from "obsidian";
import { useMemo } from "react";

export const useUpdateOnResize = (
  containerRef: React.RefObject<HTMLElement>,
  resizing: () => void,
  resizeDone: () => void,
) => {
  const resizeDoneRef = useLatest(resizeDone);
  const requestUpdate = useMemo<() => void>(
    () => debounce(() => resizeDoneRef.current(), 500, true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useResizeObserver(containerRef, () => {
    resizing();
    requestUpdate();
  });
};
