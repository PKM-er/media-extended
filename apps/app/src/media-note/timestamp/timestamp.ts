import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import type { PlayerComponent } from "@/media-view/base";
import type { MediaInfo } from "../note-index";
import {
  createTimestampGen,
  insertTimestamp,
  openOrCreateMediaNote,
} from "./utils";

export async function takeTimestamp<T extends PlayerComponent>(
  playerComponent: T,
  getSource: (player: T) => MediaInfo | null,
  ctx?: { file: TFile; editor: Editor },
) {
  const player = playerComponent.store.getState().player;
  if (!player) {
    new Notice("Player not initialized");
    return;
  }
  const mediaInfo = getSource(playerComponent);
  if (!mediaInfo) {
    new Notice("No media is opened");
    return;
  }
  const time = player.currentTime;

  const { file: newNote, editor } =
    ctx ?? (await openOrCreateMediaNote(mediaInfo, playerComponent));
  const genTimestamp = createTimestampGen(time, mediaInfo, playerComponent);

  if (time > 0) {
    insertTimestamp(genTimestamp(newNote.path), editor, () =>
      playerComponent.containerEl.focus(),
    );
  } else {
    new Notice("Playback not started yet");
  }
}
