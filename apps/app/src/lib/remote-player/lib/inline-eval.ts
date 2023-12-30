import type { WebviewTag } from "electron";

export async function evalInWebview(code: string, webview: WebviewTag) {
  code = code.replaceAll(/\bexport\b/g, "");
  return await webview.executeJavaScript(`(async function(){${code}})()`);
}
