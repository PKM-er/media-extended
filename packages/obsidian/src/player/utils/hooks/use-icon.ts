import { setIcon } from "obsidian";
import { ForwardedRef, useEffect } from "react";
import { useRefEffect } from "react-use-ref-effect";

const useIcon = <T extends HTMLElement>(icons: string[], size = 24) =>
  useRefEffect<T>((node) => {
    let tempContainer = createDiv();
    for (const id of icons) {
      setIcon(tempContainer, id, size);
      node.append(tempContainer.firstElementChild as SVGElement);
    }
  }, []);
export default useIcon;
