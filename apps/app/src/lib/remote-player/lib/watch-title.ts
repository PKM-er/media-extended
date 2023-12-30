import type { MsgCtrlRemote } from "../type";
import noOp from "./no-op";

export default function watchTitle(port: MsgCtrlRemote) {
  const titleEl = document.querySelector("title");
  let prevTitle = document.title;
  if (titleEl) {
    const observer = new MutationObserver(() => {
      if (prevTitle === document.title) return;
      port.send("titlechange", { title: document.title });
      prevTitle = document.title;
    });
    observer.observe(titleEl, {
      subtree: true,
      characterData: true,
      childList: true,
    });
    console.log("watching title");
    return () => observer.disconnect();
  } else {
    console.log(`title el not found`);
    return noOp;
  }
}
