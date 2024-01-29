/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import { WebviewTag } from "electron";
import type { OnBeforeSendHeadersListenerDetails } from "electron/main";
import type { IpcRendererEvent } from "electron/renderer";
import { Platform } from "obsidian";
import type { FileSystemAdapter, App } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";
import { createEventEmitter } from "../../lib/emitter";
import type MxPlugin from "../../mx-main";

const player_v2_api = [
  "https://api.bilibili.com/x/player/v2*",
  "https://api.bilibili.com/x/player/wbi/v2*",
];
const channelId = "mx:player_v2_api";
const headerName = "MX";

function buildMainProcessScript(webContentId: number, app: App) {
  return json`
const { session, webContents } = require("electron");
const webviewSession = session.fromPartition(${getPartition(app.appId)});
const webContent = webContents.fromId(${webContentId});
webviewSession.webRequest.onBeforeSendHeaders({ urls: ${player_v2_api} }, ({ id, method, resourceType, timestamp, url, requestHeaders, webContentsId }) => {
  if (resourceType !== 'xhr') return;
  if (requestHeaders[${headerName}]) {
    delete requestHeaders['MX'];
    callback({ requestHeaders });
    return;
  }
  webContent.send(${channelId}, { url, requestHeaders, method, timestamp, webContentsId });
})
`.trim();
}
export function buildWebviewFetch(webview: WebviewTag) {
  return function webviewFetch(url: string, init: RequestInit) {
    // prevent infinite loop
    const headers = { ...init.headers, [headerName]: "player_api_v2" };
    const code = json`fetch(${url},${{ headers }}).then(r=>r.json())`.trim();
    return webview.executeJavaScript(code);
  };
}

type RequestInfo = Pick<
  OnBeforeSendHeadersListenerDetails,
  "url" | "requestHeaders" | "method" | "timestamp" | "webContentsId"
>;

export interface WebviewRequestEvents {
  request: (data: RequestInfo) => void;
}

export async function registerWebviewRequest(this: MxPlugin) {
  if (this.reqEvents) return;
  if (!Platform.isDesktopApp)
    throw new Error("Cannot register ipc events, not in desktop app");
  const reqEvents = (this.reqEvents =
    createEventEmitter<WebviewRequestEvents>());

  const path = require("node:path") as typeof import("node:path");
  const fs = require("node:fs/promises") as typeof import("node:fs/promises");
  const { ipcRenderer } = require("electron");
  const remote =
    require("@electron/remote") as typeof import("@electron/remote");

  function onWebviewRequest(_: IpcRendererEvent, data: RequestInfo) {
    reqEvents.emit("request", data);
  }
  ipcRenderer.on(channelId, onWebviewRequest);
  this.register(() => {
    ipcRenderer.off(channelId, onWebviewRequest);
  });

  try {
    const webContentsId = remote.getCurrentWebContents().id;

    const hackScript = buildMainProcessScript(webContentsId, this.app);
    const hackScriptPath = path.join(
      (this.app.vault.adapter as FileSystemAdapter).getBasePath(),
      ...this.app.vault.configDir.split("/"),
      `mx-player-hack.${Date.now()}.js`,
    );
    await fs.writeFile(hackScriptPath, hackScript, "utf-8");
    try {
      await remote.require(hackScriptPath);
    } finally {
      await fs.rm(hackScriptPath, { force: true, maxRetries: 5 });
    }
    return reqEvents;
  } catch (e) {
    ipcRenderer.off(channelId, onWebviewRequest);
    throw e;
  }
}

function json(strings: TemplateStringsArray, ...values: any[]) {
  return strings.reduce((result, string, i) => {
    const value = values[i - 1];
    const jsonValue = value !== undefined ? JSON.stringify(value) : "";
    return result + string + jsonValue;
  }, "");
}
