import type { App } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";

export function json(strings: TemplateStringsArray, ...values: any[]) {
  return strings.reduce((result, string, i) => {
    const value = values[i];
    const jsonValue = value !== undefined ? JSON.stringify(value) : "";
    return result + string + jsonValue;
  }, "");
}

export const channelId = "mx:http_proxy";
const playerV2 = {
  type: "player_v2",
  host: "api.bilibili.com",
  pathnames: ["/x/player/v2", "/x/player/wbi/v2"],
  filter: [
    "https://api.bilibili.com/x/player/v2*",
    "https://api.bilibili.com/x/player/wbi/v2*",
  ],
  header: "player_v2",
  types: ["xhr"],
} as const;
export function buildMainProcessScript(webContentId: number, app: App) {
  return json`
const { session, webContents, net } = require("electron");
const webviewSession = session.fromPartition(${getPartition(app.appId)});
const webContent = webContents.fromId(${webContentId});
webviewSession.webRequest.onSendHeaders(
  { 
    urls: ${playerV2.filter}, type: ${playerV2.types}
  }, ({url, method, requestHeaders, webContentsId}) => {
    if (method !== "GET" || webContentsId===undefined) return;
    webContent.send(${channelId}, {type:${
    playerV2.type
  } ,url, method, requestHeaders, webContentsId});
  })
`.trim();
}

export type RequestInfo = Pick<
  Electron.OnSendHeadersListenerDetails,
  "url" | "method" | "requestHeaders"
> & { webContentsId: number; type: typeof playerV2.type };

export async function gzippedStreamToBlob(
  readableStream: ReadableStream<Uint8Array>,
  type: string,
): Promise<Blob> {
  return streamToBlob(
    readableStream.pipeThrough(new DecompressionStream("gzip")),
    type,
  );
}

export function abToStream(ab: ArrayBuffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(ab));
      controller.close();
    },
  });
}

export async function streamToBlob(
  readableStream: ReadableStream<Uint8Array>,
  type: string,
): Promise<Blob> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return new Blob(chunks, { type });
}
