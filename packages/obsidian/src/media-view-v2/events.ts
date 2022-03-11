import type { AudioPlayerElement, VideoPlayerElement } from "@vidstack/player";
import { EventRef, Events } from "obsidian";

import { InternalMediaInfo } from "../base/media-info";

type EventDefs =
  | []
  | [name: "", callback: (info: InternalMediaInfo | null) => any];

type OnArgs<T> = T extends [infer A, ...infer B]
  ? A extends string
    ? [name: A, callback: (...args: B) => any]
    : never
  : never;

export class MediaViewEvents extends Events {
  on(name: "file-loaded", callback: (info: InternalMediaInfo) => any): EventRef;
  on(
    name: "player-init",
    callback: (el: AudioPlayerElement | VideoPlayerElement) => any,
  ): EventRef;
  on(name: "player-destroy", callback: () => any): EventRef;
  on(name: string, callback: (...data: any) => any): EventRef {
    return super.on(name, callback);
  }

  trigger(
    name: "player-init",
    el: AudioPlayerElement | VideoPlayerElement,
  ): void;
  trigger(name: "player-destroy"): void;
  trigger(name: "file-loaded", info: InternalMediaInfo): void;
  trigger(name: string, ...data: any[]): void {
    /** @ts-ignore */
    return super.trigger(name, ...data);
  }
}
