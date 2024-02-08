import type { TFile, Vault } from "obsidian";
import { Platform } from "obsidian";
import { noHashUrl } from "@/lib/url";
import { checkMediaType, type MediaType } from "@/patch/media-type";
import type { MxSettings } from "@/settings/def";
import type { URLResolveResult } from "./base";
import { bilibiliResolver } from "./bilibili";
import { genericResolver } from "./generic";
import type { SupportedMediaHost } from "./supported";
import { viemoResolver } from "./viemo";
import { youtubeResolver } from "./youtube";

const allowedProtocols = new Set(["https:", "http:", "file:"]);

export class MediaURL extends URL implements URLResolveResult {
  static create(url: string | URL): MediaURL | null {
    try {
      return new MediaURL(url);
    } catch {
      return null;
    }
  }

  get inferredType(): MediaType | null {
    const ext = this.pathname.split(".").pop();
    if (!ext) return null;
    return checkMediaType(ext);
  }

  get isFileUrl(): boolean {
    return this.protocol === "file:";
  }

  compare(other: MediaURL | null | undefined): boolean {
    return (
      !!other && noHashUrl(this.cleaned).href === noHashUrl(other.cleaned).href
    );
  }

  get srcHash(): string {
    return this.source.hash;
  }

  readonly source!: URL;
  readonly cleaned!: URL;
  readonly type!: SupportedMediaHost;
  readonly id?: string;
  constructor(original: string | URL) {
    super(original);
    if (!allowedProtocols.has(this.protocol))
      throw new Error("Unsupported protocol: " + this.protocol);
    Object.assign(this, resolveUrl(this));
  }
}

export function resolveUrl(url: URL): URLResolveResult {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return genericResolver(url);
  }
  for (const resolve of [bilibiliResolver, youtubeResolver, viemoResolver]) {
    const result = resolve(url);
    if (result) return result;
  }
  return genericResolver(url);
}

export function resolveMxProtocol(
  src: URL | null,
  { getUrlMapping }: MxSettings,
): URL | null {
  if (!src) return null;
  if (src.protocol !== "mx:") return src;

  // custom protocol take // as part of the pathname
  const [, , mxProtocol] = src.pathname.split("/");
  const replace = getUrlMapping(mxProtocol);
  if (!replace) return src;
  return MediaURL.create(
    src.href.replace(`mx://${mxProtocol}/`, replace.replace(/\/*$/, "/")),
  );
}

export function fromFile(file: TFile, vault: Vault): MediaURL {
  if (checkMediaType(file.extension) === null) {
    throw new Error(`Unknown media type ${file.extension}`);
  }
  const resouceUrl = vault.getResourcePath(file);
  return new MediaURL(
    "file:///" + resouceUrl.substring(Platform.resourcePathPrefix.length),
  );
}
