import mime from "mime";
import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import {
  canProviderScreenshot,
  takeScreenshot,
} from "@/components/player/screenshot";
import { formatDuration, toDurationISOString } from "@/lib/hash/format";
import type { PlayerComponent } from "@/media-view/base";
import type { MediaInfo } from "../note-index";
import {
  createTimestampGen,
  insertTimestamp,
  mediaTitle,
  openOrCreateMediaNote,
} from "./utils";

declare module "obsidian" {
  interface Vault {
    getAvailablePathForAttachments(
      fileName: string,
      extension: string,
      activeFile: TFile | null,
    ): Promise<string>;
  }
}

export async function saveScreenshot<T extends PlayerComponent>(
  playerComponent: T,
  getSource: (player: T) => MediaInfo | null,
  ctx?: { file: TFile; editor: Editor },
) {
  const { fileManager, vault } = playerComponent.plugin.app;
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
  if (!player?.provider || !canProviderScreenshot(player.provider)) {
    new Notice("Screenshot is not supported for this media");
    return;
  }
  const { blob, time } = await takeScreenshot(player.provider);
  const genTimestamp = createTimestampGen(time, mediaInfo, playerComponent);

  const ext = mime.getExtension(blob.type);
  if (!ext) {
    new Notice("Unknown mime type: " + blob.type);
    return;
  }

  const title = mediaTitle(mediaInfo, player.state);
  const screenshotName = title + toDurationISOString(time);
  const humanizedDuration = time > 0 ? ` - ${formatDuration(time)}` : "";

  const { file: newNote, editor } =
    ctx ?? (await openOrCreateMediaNote(mediaInfo, playerComponent));
  const screenshotPath = await vault.getAvailablePathForAttachments(
    screenshotName,
    ext,
    newNote,
  );
  const screenshotFile = await vault.createBinary(
    screenshotPath,
    blob.arrayBuffer,
  );
  new Notice("Screenshot saved to " + screenshotFile.path);
  const timestamp = genTimestamp(newNote.path),
    screenshotEmbed = fileManager.generateMarkdownLink(
      screenshotFile,
      newNote.path,
      "",
      `${title}${humanizedDuration}|50`,
    );

  insertTimestamp(`- ${screenshotEmbed} ${timestamp}`, editor, () =>
    playerComponent.containerEl.focus(),
  );
}
