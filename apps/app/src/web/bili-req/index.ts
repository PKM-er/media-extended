/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { IpcRendererEvent } from "electron/renderer";
import { openDB, DBSchema } from "idb";
import { Component, Platform } from "obsidian";
import type { FileSystemAdapter } from "obsidian";
import { createEventEmitter } from "@/lib/emitter";
import { MsgCtrlLocal } from "@/lib/remote-player/type";
import type MxPlugin from "@/mx-main";
import { Aid, Bvid, Cid } from "../bili-api/base";
import { PlayerV2Data, PlayerV2Response } from "../bili-api/player-v2";
import {
  channelId,
  buildMainProcessScript,
  abToStream,
  gzippedStreamToBlob,
  RequestInfo,
} from "./base";

type SubtitleCache = {
  ab: ArrayBuffer;
  gzip: boolean;
  id: number;
  lan: string;
  lan_doc: string;
  md5: string;
} & Aid &
  Bvid &
  Cid;

interface MxCache extends DBSchema {
  "bili-subtitle": {
    key: string;
    value: SubtitleCache;
  };
}

type WebviewRequestEvents = {
  player_v2: (resp: Partial<Aid & Bvid> & Cid & { url: string }) => void;
};

function toVideoId(id: Aid & Bvid & Cid): string {
  return `${id.aid}-${id.bvid}-${id.cid}`;
}

export class BilibiliRequestHacker extends Component {
  #reqEvents = createEventEmitter<WebviewRequestEvents>();
  #playerV2ApiRespCache = new Map<string, PlayerV2Data>();
  #playerV2ApiUrlCache = new Map<string, string>();

  app;
  db;
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
    this.db = openDB<MxCache>(`mx-cache-${this.app.appId}`, 1, {
      upgrade(db) {
        db.createObjectStore("bili-subtitle");
      },
    });
    this.app = plugin.app;
  }

  async getPlayerApiResp(
    port: MsgCtrlLocal,
    timeout = 10e3,
  ): Promise<PlayerV2Data> {
    const { aid, bvid, cid } = await port.methods.bili_getManifest();
    const internalId = toVideoId({ aid, bvid, cid });
    const cached = this.#playerV2ApiRespCache.get(internalId);
    if (cached) return cached;
    let cachedUrl =
      this.#playerV2ApiUrlCache.get(`${bvid}-${cid}`) ??
      this.#playerV2ApiUrlCache.get(`${aid}-${cid}`);

    if (!cachedUrl)
      cachedUrl = await new Promise<string>((resolve, reject) => {
        const unload = this.#reqEvents.on(`player_v2`, (resp) => {
          if (!(cid === resp.cid && (aid === resp.aid || bvid === resp.bvid))) {
            return;
          }
          resolve(resp.url);
          window.clearTimeout(timeoutId);
        });
        const timeoutId = window.setTimeout(() => {
          unload();
          reject(new Error("player_v2 timeout: " + internalId));
        }, timeout);
      });

    const apiResp = await port.methods.fetch(cachedUrl, {
      gzip: false,
      credentials: "include",
    });
    if (apiResp.type !== "application/json") {
      throw new Error(
        `Unexpected response type ${apiResp.type} for player_v2 api`,
      );
    }
    const resp = JSON.parse(
      new TextDecoder().decode(apiResp.ab),
    ) as PlayerV2Response;
    if (resp.code !== 0) {
      throw new Error(`player_v2 api error: (${resp.code}) ${resp.message}`);
    }
    this.#playerV2ApiRespCache.set(internalId, resp.data);
    return resp.data;
  }

  async cacheSubtitle(id: number, subtitle: SubtitleCache) {
    const db = await this.db;
    db.put("bili-subtitle", subtitle, id.toString());
  }
  async getCachedSubtitle(id: number) {
    const db = await this.db;
    const cache = await db.get("bili-subtitle", id.toString());
    if (!cache) return null;
    const { ab, gzip } = cache;
    const mimeType = "application/json";
    const blob = gzip
      ? await gzippedStreamToBlob(abToStream(ab), mimeType)
      : new Blob([ab], { type: mimeType });
    const jsonText = await blob.text();
    return JSON.parse(jsonText);
  }
  async hasSubtitle(id: number): Promise<boolean> {
    const db = await this.db;
    return (await db.count("bili-subtitle", id.toString())) > 0;
  }

  async onload(): Promise<void> {
    if (!Platform.isDesktopApp)
      throw new Error("Cannot register ipc events, not in desktop app");

    const path = require("path") as typeof import("node:path");
    const fs = require("fs/promises") as typeof import("node:fs/promises");
    const { ipcRenderer } = require("electron");
    const remote =
      require("@electron/remote") as typeof import("@electron/remote");

    const onWebviewRequest = (_: IpcRendererEvent, data: RequestInfo) => {
      if (data.type !== "player_v2") return;
      const url = new URL(data.url);
      const aid = url.searchParams.get("aid"),
        bvid = url.searchParams.get("bvid"),
        cid = url.searchParams.get("cid");
      if ((!aid && !bvid) || !cid) return;
      this.#reqEvents.emit("player_v2", {
        url: data.url,
        aid: +aid!,
        bvid: bvid!,
        cid: +cid,
      });
      const cacheKey = bvid ? `${bvid}-${cid}` : `${aid}-${cid}`;
      this.#playerV2ApiUrlCache.set(cacheKey, data.url);
    };
    ipcRenderer.on(channelId, onWebviewRequest);

    try {
      const webContentsId = remote.getCurrentWebContents().id;

      // need hack method, since dom-ready event is fired after initial request is sent
      // so XHR/fetch monkey patching will not work for initial request interception
      const hackScript = buildMainProcessScript(webContentsId, this.app);
      const hackScriptPath = path.join(
        (this.app.vault.adapter as FileSystemAdapter).getBasePath(),
        ...this.app.vault.configDir.split("/"),
        `mx-player-hack.${Date.now()}.js`,
      );
      await fs.writeFile(hackScriptPath, hackScript, "utf-8");
      try {
        await remote.require(hackScriptPath);
        console.log("mx-player-hack loaded");
      } finally {
        await fs.rm(hackScriptPath, { force: true, maxRetries: 5 });
      }
      this.register(() => {
        ipcRenderer.off(channelId, onWebviewRequest);
      });
    } catch (e) {
      ipcRenderer.off(channelId, onWebviewRequest);
      throw e;
    }
  }
}
