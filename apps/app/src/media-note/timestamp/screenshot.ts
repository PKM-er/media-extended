import type { MediaPlayerState, VideoProvider } from "@vidstack/react";
import filenamify from "filenamify/browser";
import mime from "mime";
import type { App, Editor, TFile } from "obsidian";
import { Notice } from "obsidian";
import {
  canProviderScreenshot,
  takeScreenshot,
} from "@/components/player/screenshot";
import { formatDuration, toDurationISOString } from "@/lib/hash/format";
import type { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import type { PlayerComponent } from "@/media-view/base";
import type { MediaInfo } from "@/media-view/media-info";
import type { MxSettings } from "@/settings/def";
import { timestampGenerator, insertTimestamp, mediaTitle } from "./utils";

interface Player {
  media: MediaInfo;
  provider: VideoProvider | WebiviewMediaProvider;
  state: Readonly<MediaPlayerState>;
  app: App;
  settings: MxSettings;
}

export function validateProvider<T extends PlayerComponent>(
  playerComponent: T,
) {
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
  if (!player?.provider || !canProviderScreenshot(player.provider)) {
    new Notice("Screenshot is not supported for this media");
    return false;
  }

  return {
    media: mediaInfo,
    provider: player.provider,
    state: player.state,
    app: playerComponent.plugin.app,
    settings: playerComponent.plugin.settings.getState(),
  };
}

export async function saveScreenshot<T extends PlayerComponent>(
  playerComponent: T,
  { file: newNote, editor }: { file: TFile; editor: Editor },
): Promise<boolean> {
  const result = validateProvider(playerComponent);
  if (!result) return false;
  const {
    provider,
    state,
    media,
    app: { fileManager, vault },
    settings: {
      insertBefore,
      screenshotTemplate,
      screenshotEmbedTemplate,
      screenshotQuality,
      screenshotFormat,
    },
  } = result;

  const { blob, time } = await takeScreenshot(
    provider,
    screenshotFormat,
    screenshotQuality,
  );
  const genTimestamp = timestampGenerator(time, media, result);

  const ext = mime.getExtension(blob.type);
  if (!ext) {
    new Notice("Unknown mime type: " + blob.type);
    return false;
  }

  const title = mediaTitle(media, state);
  const screenshotName =
    filenamify(title, { replacement: "_" }) + toDurationISOString(time);
  const humanizedDuration = time > 0 ? ` - ${formatDuration(time)}` : "";

  const screenshotPath = await fileManager.getAvailablePathForAttachment(
    `${screenshotName}.${ext}`,
    newNote.path,
  );
  const screenshotFile = await vault.createBinary(
    screenshotPath,
    blob.arrayBuffer,
  );
  new Notice("Screenshot saved to " + screenshotFile.path);

  try {
    insertTimestamp(
      {
        timestamp: genTimestamp(newNote.path),
        screenshot: fileManager
          .generateMarkdownLink(
            screenshotFile,
            newNote.path,
            "",
            screenshotEmbedTemplate
              .replaceAll("{{TITLE}}", title)
              .replaceAll("{{DURATION}}", humanizedDuration),
          )
          .replace(/^!/, ""),
      },
      {
        editor,
        template: screenshotTemplate,
        insertBefore,
      },
    );
    return true;
  } catch (e) {
    new Notice("Failed to insert screenshot, see console for details");
    console.error("Failed to insert screenshot", e);
    return false;
  }
}

export async function copyScreenshot(player: Player) {
  const { provider } = player;
  const {
    blob: { arrayBuffer, type },
  } = await takeScreenshot(provider, "image/png", undefined);
  let item: ClipboardItem;
  try {
    item = new ClipboardItem({ [type]: new Blob([arrayBuffer], { type }) });
  } catch (e) {
    new Notice("Failed to copy screenshot, see console for details");
    console.error("Failed to copy screenshot", e);
    return false;
  }
  await navigator.clipboard.write([item]);
  new Notice("Screenshot copied to clipboard");
}

// TODO: copy html with timestamp link & screenshot encoded in base64
