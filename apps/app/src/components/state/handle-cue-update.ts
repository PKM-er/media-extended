import type { TextTrackCueChangeEvent } from "@vidstack/react";
import type { EventCallback } from "maverick.js/std";
import type { Workspace } from "obsidian";
import type { MediaInfo } from "@/info/media-info";
import { onPlayerMounted, type MediaViewStoreApi } from "../context";

declare module "obsidian" {
  interface App {
    commands: {
      commands: Record<string, Command>;
    };
  }
  interface Workspace {
    on(
      name: "mx:cue-change",
      callback: (
        source: MediaInfo,
        trackId: string,
        cueIds: string[],
      ) => EventRef,
    ): any;
    trigger(
      name: "mx:cue-change",
      source: MediaInfo,
      trackId: string,
      cueIds: string[],
    ): void;
  }
}

export function handleTempFrag(store: MediaViewStoreApi, workspace: Workspace) {
  return onPlayerMounted(store, (player) =>
    player.subscribe(({ textTrack }) => {
      if (!textTrack) return;
      const onCueChange: EventCallback<TextTrackCueChangeEvent & Event> = (
        evt,
      ) => {
        const source = store.getState().source?.url;
        if (!source) return;
        const track = evt.target;
        workspace.trigger(
          "mx:cue-change",
          source,
          track.id,
          track.activeCues.map((c) => c.id),
        );
      };
      textTrack.addEventListener("cue-change", onCueChange);
      return textTrack.removeEventListener("cue-change", onCueChange);
    }),
  );
}
