/* eslint-disable @typescript-eslint/naming-convention */
import type { TextTrackInit, VTTCueInit, VTTRegionInit } from "@vidstack/react";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import { isEqual } from "lodash-es";
import type { VTTHeaderMetadata } from "media-captions";
import { Component } from "obsidian";
import { createEventEmitter } from "@/lib/emitter";
import { gzipBlobToJson, jsonToGzipBlob } from "@/lib/store";
import type MxPlugin from "@/mx-main";

interface CaptionData extends TextTrackInit {
  /** caption internal id */
  id: string;
  /** media source id */
  sid: string;
  data: {
    blob: Blob;
    cueCount: number;
  } | null;
}

export type VTTCueWithId = VTTCueInit & { id: string };

export interface VTTContent {
  cues: VTTCueWithId[];
  regions?: VTTRegionInit[];
  metadata?: VTTHeaderMetadata;
}

interface MxCache extends DBSchema {
  "caption-data": {
    key: [string, string];
    value: CaptionData;
    indexes: { "idx-sid": "sid" };
  };
  "source-cache": {
    key: string;
    value: {
      id: string;
      title: string;
    };
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
    "title-update": (sid: string, title: string) => void;
    "caption-update": (sid: string, id: string) => void;
  }>();

  onload(): void {
    openDB<MxCache>("mx-cache", 1, {
      upgrade(db) {
        const captionStore = db.createObjectStore("caption-data", {
          keyPath: ["sid", "id"],
        });
        captionStore.createIndex("idx-sid", "sid", { unique: false });
        db.createObjectStore("source-cache", {
          keyPath: "id",
        });
      },
    }).then((db) => {
      this.#db = db;
      this.event.emit("db-ready", db);
    });
  }

  async getTitle(sid: string) {
    const tx = (await this.db).transaction("source-cache", "readonly");
    const store = tx.store;
    const data = await store.get(sid);
    if (!data) return null;
    return data.title;
  }
  async updateSourceCache(sid: string, data: { title: string }) {
    const tx = (await this.db).transaction("source-cache", "readwrite");
    const store = tx.store;
    const prev = await store.get(sid);
    await store.put({ id: sid, ...data });
    await tx.done;
    if (data.title !== prev?.title) {
      this.event.emit("title-update", sid, data.title);
    }
  }

  async saveCaptionList(
    sid: string,
    data: (TextTrackInit & { id: string })[],
  ): Promise<void> {
    const tx = (await this.db).transaction("caption-data", "readwrite");
    const store = tx.store;
    const updated: { id: string; sid: string }[] = [];
    await Promise.all(
      data.map(async (item) => {
        const prev = await store.get([sid, item.id]);
        const next = { sid, ...item, data: prev?.data ?? null };
        if (!diffCaption(next, prev)) {
          updated.push({ id: item.id, sid });
        }
        await store.put(next);
      }),
    );
    await tx.done;
    updated.forEach(({ id, sid }) =>
      this.event.emit("caption-update", sid, id),
    );
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
      this.event.emit("caption-update", sid, id);
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

function diffCaption(a: CaptionData, b: CaptionData | undefined) {
  if (!b) return false;
  const { data: aData, ...aInfo } = a;
  const { data: bData, ...bInfo } = b;
  if (isEqual(aInfo, bInfo) && aData?.cueCount === bData?.cueCount) return true;
  return false;
}
