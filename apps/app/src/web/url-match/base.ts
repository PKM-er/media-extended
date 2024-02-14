import { removeTempFrag } from "@/lib/hash/format";
import type { MediaHost } from "./supported";
import type { MediaURL } from ".";

export type URLResolver = (src: MediaURL) => URLResolveResult;
export type URLDetecter = (src: MediaURL) => MediaHost | null;

export interface URLResolveResult {
  source: URL;
  cleaned: URL;
  id?: string;
}

export function removeHashTempFragment(url: URL): URL {
  const cleaned = new URL(url.href);
  const newHash = removeTempFrag(cleaned.hash);
  if (cleaned.hash === newHash) return url;
  return cleaned;
}
