import { setIcon } from "obsidian";
import { useCallback } from "react";

export const useIcon = <T extends HTMLElement>(icons: string[], size = 24) =>
  useCallback((node: T | null) => {
    let tempContainer = createDiv();
    if (node) {
      for (const id of icons) {
        setIcon(tempContainer, id, size);
        node.append(tempContainer.firstElementChild as SVGElement);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
