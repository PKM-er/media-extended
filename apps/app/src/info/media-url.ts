import { fileURLToPath } from "url";
import type { Vault, TFile } from "obsidian";
import { FileSystemAdapter, normalizePath } from "obsidian";
import { addTempFrag, removeTempFrag } from "@/lib/hash/format";
import { parseTempFrag, type TempFragment } from "@/lib/hash/temporal-frag";
import path from "@/lib/path";
import { noHash } from "@/lib/url";
import { resolveUrlMatcher, type URLResolveResult } from "@/web/url-match";

import { checkMediaType, type MediaType } from "./media-type";
import type { MediaHost } from "./supported";

const allowedProtocols = new Set(["https:", "http:", "file:"]);

export class MediaURL extends URL implements URLResolveResult {
  static create(url: string | URL, mx?: URL | string): MediaURL | null {
    if (url instanceof MediaURL) {
      return url.clone();
    }
    try {
      return new MediaURL(url, mx);
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
  get filePath(): string | null {
    if (this.isFileUrl) {
      try {
        return fileURLToPath(this);
      } catch (e) {
        console.error("Failed to convert file url to path", e, this.href);
        return null;
      }
    }
    return null;
  }

  getVaultFile(vault: Vault): TFile | null {
    if (!(vault.adapter instanceof FileSystemAdapter)) return null;
    const filePath = this.filePath;
    const vaultBasePath = vault.adapter.getBasePath();
    if (!filePath) return null;
    const relative = path.relative(vaultBasePath, filePath);
    if (/^\.\.[/\\]/.test(relative) || path.isAbsolute(relative)) return null;
    const normalized = normalizePath(relative);
    return vault.getFileByPath(normalized);
  }

  compare(other: MediaURL | null | undefined): boolean {
    return !!other && this.jsonState.source === other.jsonState.source;
  }

  /**
   * Print the url with temporal fragment encoded (if supported)
   * @returns the url without hash
   */
  print(frag?: TempFragment): string {
    if (this.mxUrl) return noHash(this.mxUrl.href);
    if (!frag) return this.jsonState.source;
    if (this.#resolved.print) return this.#resolved.print(frag);
    return this.jsonState.source;
  }

  get tempFrag(): TempFragment | null {
    return parseTempFrag(this.hash);
  }
  // get isTimestamp(): boolean {
  //   return !!this.tempFrag && isTimestamp(this.tempFrag);
  // }

  // setHash(hash: string | ((hash: string) => string)): MediaURL {
  //   const prevHash = this.hash.replace(/^#+/, "");
  //   const newHash =
  //     typeof hash === "string" ? hash.replace(/^#+/, "") : hash(prevHash);
  //   if (newHash === prevHash) return this;
  //   const newURL = this.clone();
  //   newURL.hash = newHash;
  //   return newURL;
  // }
  setTempFrag(tempFrag: TempFragment | null): MediaURL {
    const newUrl = this.clone();
    const notf = removeTempFrag(this.hash);
    if (!tempFrag) {
      newUrl.hash = notf;
    } else {
      newUrl.hash = addTempFrag(notf, tempFrag);
    }
    return newUrl;
  }

  clone() {
    return new MediaURL(this, this.mxUrl ?? undefined);
  }

  get readableHref() {
    return decodeURI(this.href);
  }

  #resolved: URLResolveResult;

  get source() {
    return this.#resolved.source;
  }
  get cleaned(): URL {
    return this.#resolved.cleaned;
  }
  get id(): string | undefined {
    return this.#resolved.id;
  }
  readonly type: MediaHost;

  get jsonState(): { source: string; hash: string } {
    return {
      source: noHash(this.mxUrl ?? this.cleaned),
      hash: addTempFrag(this.hash, this.#resolved.tempFrag),
    };
  }

  mxUrl: URL | null;
  constructor(original: string | URL, mx?: URL | string) {
    super(original);
    this.mxUrl = mx ? new URL(mx) : null;
    if (!allowedProtocols.has(this.protocol))
      throw new Error("Unsupported protocol: " + this.protocol);
    const { type, resolved } = resolveUrlMatcher(this);
    this.#resolved = resolved;
    this.type = type;
  }
}
