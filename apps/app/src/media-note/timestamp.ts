import { Notice } from "obsidian";
import type { Editor } from "obsidian";
import { formatDuration, toTempFragString } from "@/lib/hash/format";
import { noHash } from "@/lib/url";
import type { PlayerComponent } from "@/media-view/base";
import type { FileMediaInfo } from "./note-index/file-info";
import type { UrlMediaInfo } from "./note-index/url-info";

export function takeTimestampOnUrl<T extends PlayerComponent>(
  playerComponent: T,
  getSource: (player: T) => UrlMediaInfo | null,
) {
  return async function takeTimestamp() {
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
    const sourceUrl = mediaInfo.source;

    const time = player.currentTime;
    const title =
      player.state.title ??
      sourceUrl.hostname + decodeURI(sourceUrl.pathname).replaceAll("/", "_");

    const { editor } = await playerComponent.plugin.leafOpener.openNote(
      mediaInfo,
      {
        title,
        fm: () => ({ media: noHash(sourceUrl) }),
      },
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
  getSource: (player: T) => FileMediaInfo | null,
) {
  const { metadataCache, fileManager } = playerComponent.plugin.app;
  return async function takeTimestamp() {
    const player = playerComponent.store.getState().player;
    if (!player) {
      new Notice("Player not initialized");
      return;
    }
    const mediaInfo = getSource(playerComponent);
    if (!mediaInfo) {
      new Notice("No media file is opened");
      return;
    }

    const { file, type: mediaType } = mediaInfo;

    const time = player.currentTime;
    const title = player.title ?? file.basename;

    const { file: newNote, editor } =
      await playerComponent.plugin.leafOpener.openNote(mediaInfo, {
        title,
        fm: (newNotePath) => ({
          [mediaType]: `[[${metadataCache.fileToLinktext(file, newNotePath)}]]`,
        }),
        sourcePath: file.path,
      });

    if (time > 0) {
      const hash = toTempFragString({ start: time, end: -1 })!;
      const link = fileManager.generateMarkdownLink(
        file,
        newNote.path,
        "#" + hash,
        formatDuration(time),
      );
      insertTimestamp(link.replace(/^!/, ""), editor, () =>
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
