import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import type { PlayerComponent } from "@/media-view/base";
import { createTimestampGen, insertTimestamp } from "./utils";

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
  const genTimestamp = createTimestampGen(time, mediaInfo, playerComponent);

  if (time > 0) {
    insertTimestamp(genTimestamp(mediaNote.path), editor, () =>
      playerComponent.containerEl.focus(),
    );
  } else {
    new Notice("Playback not started yet");
  }
}
