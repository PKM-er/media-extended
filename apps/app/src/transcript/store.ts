/* eslint-disable @typescript-eslint/naming-convention */
import type { TextTrackInit, VTTContent } from "@vidstack/react";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import { Component } from "obsidian";
import { createEventEmitter } from "@/lib/emitter";
import { gzipBlobToJson, jsonToGzipBlob } from "@/lib/store";
import type MxPlugin from "@/mx-main";

interface MxCache extends DBSchema {
  "caption-data": {
    key: [string, string];
    value: TextTrackInit & {
      /** caption internal id */
      id: string;
      /** media source id */
      sid: string;
      data: {
        blob: Blob;
        cueCount: number;
      } | null;
    };
    indexes: { "idx-sid": "sid" };
  };
}

export class CacheStore extends Component {
  constructor(public plugin: MxPlugin) {
    super();
  }

  #db: IDBPDatabase<MxCache> | null = null;

  get db(): Promise<IDBPDatabase<MxCache>> {
    if (this.#db) return Promise.resolve(this.#db);
    return new Promise((resolve, reject) => {
      const unload = this.event.once("db-ready", (db) => {
        resolve(db);
        window.clearTimeout(timeoutId);
      });
      const timeoutId = window.setTimeout(() => {
        reject(new Error("Timeout"));
        unload();
      }, 5e3);
    });
  }
  async withDb<T>(
    callback: (db: IDBPDatabase<MxCache>) => T,
  ): Promise<Awaited<T>> {
    const db = await this.db;
    return await callback(db);
  }

  event = createEventEmitter<{
    "db-ready": (db: IDBPDatabase<MxCache>) => void;
  }>();

  onload(): void {
    openDB<MxCache>("mx-cache", 1, {
      upgrade(db) {
        const store = db.createObjectStore("caption-data", {
          keyPath: ["sid", "id"],
        });
        store.createIndex("idx-sid", "sid", { unique: false });
      },
    }).then((db) => {
      this.#db = db;
      this.event.emit("db-ready", db);
    });
  }

  async saveCaptionList(
    sid: string,
    data: (TextTrackInit & { id: string })[],
  ): Promise<void> {
    const tx = (await this.db).transaction("caption-data", "readwrite");
    const store = tx.store;
    await Promise.all(
      data.map(async (item) => {
        const prev = await store.get([sid, item.id]);
        await store.put({ sid, ...item, data: prev?.data ?? null });
      }),
    );
    await tx.done;
  }
  updateCaption = (sid: string, id: string, data: VTTContent | null) =>
    this.withDb(async (db): Promise<boolean> => {
      const blob = await jsonToGzipBlob(data);
      const tx = db.transaction("caption-data", "readwrite");
      const store = tx.store;
      const item = await store.get([sid, id]);
      if (!item) return false;
      if (data) {
        item.data = {
          blob,
          cueCount: data.cues?.length ?? -1,
        };
      } else {
        item.data = null;
      }
      await store.put(item);
      await tx.done;
      return true;
    });

  async getCaptions(sid: string) {
    const tx = (await this.db).transaction("caption-data", "readonly");
    const store = tx.store;
    const index = store.index("idx-sid");
    const result = await index.getAllKeys(IDBKeyRange.only(sid));
    if (result.length === 0) return [];
    return Promise.all(result.map(async (key) => (await store.get(key))!));
  }
  getCaption = (sid: string, id: string) =>
    this.withDb(async (db) => {
      const data = await db.get("caption-data", [sid, id]);
      if (!data) return null;
      const { data: vttData, ...info } = data;
      if (!vttData) return null;
      return {
        ...info,
        content: await CacheStore.decompress(vttData.blob),
      };
    });

  static decompress(blob: Blob) {
    return gzipBlobToJson<VTTContent>(blob);
  }
}
