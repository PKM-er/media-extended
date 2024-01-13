import { Notice } from "obsidian";
import type { Editor, TFile } from "obsidian";
import { formatDuration, toTempFragString } from "@/lib/hash/format";
import { noHash, toURL } from "@/lib/url";
import type { PlayerComponent } from "@/media-view/base";
import { checkMediaType } from "@/patch/utils";
import { noteUtils } from "./utils";

export function takeTimestampOnUrl<T extends PlayerComponent>(
  playerComponent: T,
  getSource: (player: T) => string | null,
) {
  const { mediaNoteFinder, openMarkdownView } = noteUtils(
    playerComponent.plugin.app,
  );
  return async function takeTimestamp() {
    const player = playerComponent.store.getState().player;
    if (!player) {
      new Notice("Player not initialized");
      return;
    }
    const source = getSource(playerComponent);
    if (!source) {
      new Notice("No media is opened");
      return;
    }
    const sourceUrl = toURL(source);
    if (!sourceUrl) {
      new Notice("Invalid URL: " + source);
      return;
    }

    const time = player.currentTime;
    const existingMediaNotes = mediaNoteFinder.url(source);
    const title =
      player.title ??
      sourceUrl.hostname + decodeURI(sourceUrl.pathname).replaceAll("/", "_");

    const { editor } = await openMarkdownView(
      existingMediaNotes,
      title,
      () => ({ media: noHash(sourceUrl) }),
      "",
    );

    if (time > 0) {
      insertTimestamp(formatUrlTimestamp(time, noHash(sourceUrl)), editor, () =>
        playerComponent.containerEl.focus(),
      );
    } else {
      new Notice("Playback not started yet");
    }
  };
}

export function takeTimestampOnFile<T extends PlayerComponent>(
  playerComponent: T,
  getSource: (player: T) => TFile | null,
) {
  const { mediaNoteFinder, openMarkdownView } = noteUtils(
    playerComponent.plugin.app,
  );
  const { metadataCache, fileManager } = playerComponent.plugin.app;
  return async function takeTimestamp() {
    const player = playerComponent.store.getState().player;
    if (!player) {
      new Notice("Player not initialized");
      return;
    }
    const source = getSource(playerComponent);
    if (!source) {
      new Notice("No media file is opened");
      return;
    }
    const mediaType = checkMediaType(source.extension);
    if (!mediaType) {
      new Notice("media file format not supported");
      return;
    }

    const time = player.currentTime;
    const existingMediaNotes = mediaNoteFinder.local(source);
    const title = player.title ?? source.basename;

    const view = await openMarkdownView(
      existingMediaNotes,
      title,
      (newNotePath) => ({
        [mediaType]: `[[${metadataCache.fileToLinktext(source, newNotePath)}]]`,
      }),
      source.path,
    );

    if (time > 0) {
      const hash = toTempFragString({ start: time, end: -1 })!;
      const link = fileManager.generateMarkdownLink(
        source,
        view.file.path,
        "#" + hash,
        formatDuration(time),
      );
      insertTimestamp(link.replace(/^!/, ""), view.editor, () =>
        playerComponent.containerEl.focus(),
      );
    } else {
      new Notice("Playback not started yet");
    }
  };
}

function insertTimestamp(link: string, editor: Editor, focus?: () => void) {
  insertToCursor("\n" + link, editor);
  focus?.();
}

function insertToCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("to");
  editor.replaceRange(str, cursor, cursor);
  editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}
function formatUrlTimestamp(time: number, url: string) {
  return `[${formatDuration(time)}](${url}#${toTempFragString({
    start: time,
    end: -1,
  })})`;
}
