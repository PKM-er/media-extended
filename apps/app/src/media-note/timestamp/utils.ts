import type { MediaState } from "@vidstack/react";
import type { Editor } from "obsidian";
import { formatDuration, toTempFragString } from "@/lib/hash/format";
import { noHash } from "@/lib/url";
import type { PlayerComponent } from "@/media-view/base";
import { isFileMediaInfo } from "@/media-view/media-info";
import type { MediaInfo, FileMediaInfo } from "@/media-view/media-info";
import type { MediaURL } from "@/web/url-match";

export function insertTimestamp(
  { timestamp, screenshot }: { timestamp: string; screenshot?: string },
  {
    template,
    editor,
    insertBefore,
  }: { template: string; editor: Editor; insertBefore?: boolean },
) {
  let toInsert = template.replace("{{TIMESTAMP}}", timestamp);
  if (screenshot) {
    toInsert = toInsert.replace("{{SCREENSHOT}}", screenshot);
  }

  if (insertBefore) {
    insertBeforeCursor(toInsert, editor);
  } else {
    insertToCursor(toInsert, editor);
  }
}
function insertToCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("to");
  editor.replaceRange(str, cursor, cursor);
  editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}
function insertBeforeCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("from");
  editor.replaceRange(str, cursor, cursor);
  // editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}

function fileTitle(media: FileMediaInfo) {
  return media.file.basename;
}

function urlTitle({ source }: MediaURL, playerState: MediaState) {
  return (
    playerState.title ??
    source.hostname + decodeURI(source.pathname).replaceAll("/", "_")
  );
}

export function mediaTitle(mediaInfo: MediaInfo, playerState: MediaState) {
  return isFileMediaInfo(mediaInfo)
    ? fileTitle(mediaInfo)
    : urlTitle(mediaInfo, playerState);
}

export function openOrCreateMediaNote(
  mediaInfo: MediaInfo,
  playerComponent: PlayerComponent,
) {
  const { metadataCache } = playerComponent.plugin.app;
  const player = playerComponent.store.getState().player;
  if (!player) {
    throw new Error("Player not initialized");
  }
  if (isFileMediaInfo(mediaInfo)) {
    const { file, type: mediaType } = mediaInfo;
    return playerComponent.plugin.leafOpener.openNote(mediaInfo, {
      title: fileTitle(mediaInfo),
      fm: (newNotePath) => ({
        [mediaType]: `[[${metadataCache.fileToLinktext(file, newNotePath)}]]`,
      }),
      sourcePath: file.path,
    });
  } else {
    const sourceUrl = mediaInfo.cleaned;
    return playerComponent.plugin.leafOpener.openNote(mediaInfo, {
      title: urlTitle(mediaInfo, player.state),
      fm: () => ({ media: noHash(sourceUrl) }),
    });
  }
}

export function timestampGenerator(
  time: number,
  mediaInfo: MediaInfo,
  playerComponent: PlayerComponent,
): (newNotePath: string) => string {
  const { fileManager } = playerComponent.plugin.app;
  const { timestampOffset } = playerComponent.plugin.settings.getState();
  const duration = playerComponent.store.getState().player?.state.duration;

  time += timestampOffset;
  if (time < 0) time = 0;
  if (duration && time > duration) time = duration;

  const timeInDuration = formatDuration(time);
  const hash =
    time > 0 ? `#${toTempFragString({ start: time, end: -1 })!}` : "";
  if (isFileMediaInfo(mediaInfo)) {
    const { file } = mediaInfo;
    return (newNotePath: string) =>
      fileManager
        .generateMarkdownLink(file, newNotePath, hash, timeInDuration)
        .replace(/^!/, "");
  } else {
    const sourceUrl = mediaInfo.cleaned;
    return () => `[${timeInDuration}](${noHash(sourceUrl)}${hash})`;
  }
}
