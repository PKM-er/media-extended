import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import type { PlayerComponent } from "@/media-view/base";
import { timestampGenerator, insertTimestamp } from "./utils";

export async function takeTimestamp<T extends PlayerComponent>(
  playerComponent: T,
  { file: mediaNote, editor }: { file: TFile; editor: Editor },
) {
  const player = playerComponent.store.getState().player;
  if (!player) {
    new Notice("Player not initialized");
    return;
  }
  const mediaInfo = playerComponent.getMediaInfo();
  if (!mediaInfo) {
    new Notice("No media is opened");
    return;
  }
  const time = player.currentTime;
  const genTimestamp = timestampGenerator(time, mediaInfo, playerComponent);

  if (time <= 0) {
    new Notice("Playback not started yet");
    return;
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
  } catch (e) {
    new Notice("Failed to insert timestamp, see console for details");
    console.error("Failed to insert timestamp", e);
  }
}
