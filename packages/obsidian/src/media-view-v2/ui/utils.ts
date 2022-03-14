import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";

export const useIcon = <T extends HTMLElement>(icons: string[], size = 24) => {
  let tempContainer = createDiv();
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) {
      for (const id of icons) {
        setIcon(tempContainer, id, size);
        ref.current.append(tempContainer.firstElementChild as SVGElement);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
};
