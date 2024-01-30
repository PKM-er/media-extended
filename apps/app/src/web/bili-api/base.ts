import type { BilibiliFetch } from "../session/bilibili";

export interface Aid {
  aid: number;
}
export interface Bvid {
  bvid: string;
}

export interface Cid {
  cid: number;
}

export type BilibiliPlayerManifest = Aid &
  Bvid &
  Cid & { p: number; pid: number };

export interface BilibiliApiContext {
  fetch: BilibiliFetch;
}

export class BiliApiError extends Error {
  constructor(message: string, code: number) {
    super(`${message} (code: ${code})`);
  }
}
