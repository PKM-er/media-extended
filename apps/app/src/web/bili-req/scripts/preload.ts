import { json } from "../base";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __USERSCRIPT__: string;

process.once("document-start", () => {
  if (!window.location.hostname.endsWith("bilibili.com")) {
    return;
  }
  console.log("preload.js");
  const script = document.createElement("script");
  const scriptId = "monkey-patch-xmlhttprequest";
  script.id = scriptId;
  script.textContent =
    `try{` +
    __USERSCRIPT__ +
    `}finally{` +
    json`document.getElementById(${scriptId})?.remove();` +
    `}`;
  document.documentElement.prepend(script);
});
