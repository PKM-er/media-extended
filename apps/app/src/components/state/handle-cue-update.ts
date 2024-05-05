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
      callback: (source: MediaInfo, trackId: string, cueIds: string[]) => any,
      ctx?: any,
    ): any;
    trigger(
      name: "mx:cue-change",
      source: MediaInfo,
      trackId: string,
      cueIds: string[],
    ): void;
  }
}

export function handleCueUpdate(
  store: MediaViewStoreApi,
  workspace: Workspace,
) {
  return onPlayerMounted(store, (player) =>
    player.subscribe(({ textTrack }) => {
      if (!textTrack) return;
      const onCueChange = () => {
        const source = store.getState().source?.url;
        if (!source) return;
        workspace.trigger(
          "mx:cue-change",
          source,
          textTrack.id,
          textTrack.activeCues.map((c) => c.id),
        );
      };
      onCueChange();
      textTrack.addEventListener("cue-change", onCueChange);
      return () => {
        textTrack.removeEventListener("cue-change", onCueChange);
      };
    }),
  );
}
