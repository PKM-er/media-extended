import type { WebviewTag } from "electron";

export async function evalInWebview(code: string, webview: WebviewTag) {
  // set userGesture to true to allow full control
  // like triggering play/pause without user interaction
  return await webview.executeJavaScript(`(async function(){${code}})()`);
}
