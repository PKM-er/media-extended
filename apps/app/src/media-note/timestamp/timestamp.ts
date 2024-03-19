import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import type { PlayerComponent } from "@/media-view/base";
import { timestampGenerator, insertTimestamp } from "./utils";

export async function takeTimestamp<T extends PlayerComponent>(
  playerComponent: T,
  { file: mediaNote, editor }: { file: TFile; editor: Editor },
): Promise<boolean> {
  const player = playerComponent.store.getState().player;
  if (!player) {
    new Notice("Player not initialized");
    return false;
  }
  const mediaInfo = playerComponent.getMediaInfo();
  if (!mediaInfo) {
    new Notice("No media is opened");
    return false;
  }
  const time = player.currentTime;
  const genTimestamp = timestampGenerator(time, mediaInfo, {
    app: playerComponent.plugin.app,
    settings: playerComponent.plugin.settings.getState(),
    duration: player.state.duration,
  });

  if (time <= 0) {
    new Notice("Playback not started yet");
    return false;
  }
  const { insertBefore, timestampTemplate: template } =
    playerComponent.plugin.settings.getState();

  try {
    insertTimestamp(
      { timestamp: genTimestamp(mediaNote.path) },
      {
        editor,
        template,
        insertBefore,
      },
    );
    return true;
  } catch (e) {
    new Notice("Failed to insert timestamp, see console for details");
    console.error("Failed to insert timestamp", e);
    return false;
  }
}
