import { EventRef, Events } from "obsidian";

import { InternalMediaInfo } from "../base/media-info";

export class MediaViewEvents extends Events {
  on(name: "file-loaded", callback: (info: InternalMediaInfo) => any): EventRef;
  on(name: "player-init", callback: (el: HTMLMediaElement) => any): EventRef;
  on(name: "player-destroy", callback: () => any): EventRef;
  on(
    name: "screenshot",
    callback: (data: Promise<Blob | null>) => any,
  ): EventRef;
  on(name: string, callback: (...data: any) => any): EventRef {
    return super.on(name, callback);
  }

  trigger(name: "player-init", el: HTMLMediaElement): void;
  trigger(name: "screenshot", data: Promise<Blob | null>): void;
  trigger(name: "player-destroy"): void;
  trigger(name: "file-loaded", info: InternalMediaInfo): void;
  trigger(name: string, ...data: any[]): void {
    /** @ts-ignore */
    return super.trigger(name, ...data);
  }
}
