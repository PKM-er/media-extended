import type { TFile } from "obsidian";

export interface LinkEvent {
  onExternalLinkClick(url: string, newLeaf: boolean, fallback: () => void): any;
  onInternalLinkClick(
    linktext: string,
    sourcePath: string,
    newLeaf: boolean,
    fallback: () => void,
  ): any;
}

export type MediaEmbedSource = "popover" | "view" | "embed";
export interface MediaEmbedRenderHandler {
  (
    type: "video" | "audio",
    el: HTMLElement,
    file: TFile,
    source: MediaEmbedSource,
    fallback: () => Promise<void>,
  ): Promise<void>;
}
