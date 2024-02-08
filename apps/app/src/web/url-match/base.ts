import type { SupportedMediaHost } from "./supported";

export type URLResolver = (src: URL) => URLResolveResult | null;

export interface URLResolveResult {
  source: URL;
  cleaned: URL;
  type: SupportedMediaHost;
  id?: string;
}
