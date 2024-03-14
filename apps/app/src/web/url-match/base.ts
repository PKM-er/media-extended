import { removeTempFrag } from "@/lib/hash/format";
import type { TempFragment } from "@/lib/hash/temporal-frag";
import type { MediaHost } from "./supported";
import type { MediaURL } from ".";

export type URLResolver = (src: MediaURL) => URLResolveResult;
export type URLDetecter = (src: MediaURL) => MediaHost | null;

export interface URLResolveResult {
  source: URL;
  cleaned: URL;
  print?: (frag: TempFragment) => string;
  tempFrag: TempFragment | null;
  id?: string;
}

export function removeHashTempFragment(url: URL): URL {
  const cleaned = new URL(url.href);
  const newHash = removeTempFrag(cleaned.hash);
  if (cleaned.hash === newHash) return url;
  return cleaned;
}
