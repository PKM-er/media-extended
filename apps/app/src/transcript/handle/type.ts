import type { VTTCueInit, VTTRegionInit } from "@vidstack/react";
import type { VTTHeaderMetadata } from "media-captions";

export type VTTCueWithId = VTTCueInit & { id: string };

export interface VTTContent {
  cues: VTTCueWithId[];
  regions?: VTTRegionInit[];
  metadata?: VTTHeaderMetadata;
}
