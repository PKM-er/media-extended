import type { TFile } from "obsidian";
import type { MediaURL } from "./media-url";

interface TranscriptSourceBase {
  type: string;
  /** track label for lang, etc */
  label?: string;
}

export interface TranscriptUrlSource extends TranscriptSourceBase {
  type: "url";
  url: URL;
}
export interface TranscriptFileSource extends TranscriptSourceBase {
  type: "file";
  file: TFile | URL;
}
export interface TranscriptWebsiteSource extends TranscriptSourceBase {
  type: "website";
  id: string;
  media: MediaURL;
}
export type TranscriptSource =
  | TranscriptUrlSource
  | TranscriptFileSource
  | TranscriptWebsiteSource;
