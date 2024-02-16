import filenamify from "filenamify/browser";
import mime from "mime";
import type { Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import {
  canProviderScreenshot,
  takeScreenshot,
} from "@/components/player/screenshot";
import { formatDuration, toDurationISOString } from "@/lib/hash/format";
import type { PlayerComponent } from "@/media-view/base";
import { timestampGenerator, insertTimestamp, mediaTitle } from "./utils";

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
  { file: newNote, editor }: { file: TFile; editor: Editor },
) {
  const { fileManager, vault } = playerComponent.plugin.app;
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
  if (!player?.provider || !canProviderScreenshot(player.provider)) {
    new Notice("Screenshot is not supported for this media");
    return;
  }
  const { screenshotQuality, screenshotFormat } =
    playerComponent.plugin.settings.getState();
  const { blob, time } = await takeScreenshot(
    player.provider,
    screenshotFormat,
    screenshotQuality,
  );
  const genTimestamp = timestampGenerator(time, mediaInfo, playerComponent);

  const ext = mime.getExtension(blob.type);
  if (!ext) {
    new Notice("Unknown mime type: " + blob.type);
    return;
  }

  const title = mediaTitle(mediaInfo, player.state);
  const screenshotName =
    filenamify(title, { replacement: "_" }) + toDurationISOString(time);
  const humanizedDuration = time > 0 ? ` - ${formatDuration(time)}` : "";

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
  const { insertBefore, screenshotTemplate, screenshotEmbedTemplate } =
    playerComponent.plugin.settings.getState();

  const timestamp = genTimestamp(newNote.path),
    screenshotLink = fileManager
      .generateMarkdownLink(
        screenshotFile,
        newNote.path,
        "",
        screenshotEmbedTemplate
          .replaceAll("{{TITLE}}", title)
          .replaceAll("{{DURATION}}", humanizedDuration),
      )
      .replace(/^!/, "");

  insertTimestamp(
    { timestamp, screenshot: screenshotLink },
    {
      editor,
      template: screenshotTemplate,
      insertBefore,
    },
  );
}
