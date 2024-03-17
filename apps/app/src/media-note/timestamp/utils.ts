import type { MediaState } from "@vidstack/react";
import { Notice } from "obsidian";
import type { App, Editor } from "obsidian";
import { formatDuration, toTempFragString } from "@/lib/hash/format";
import type { TempFragment } from "@/lib/hash/temporal-frag";
import type { PlayerComponent } from "@/media-view/base";
import { isFileMediaInfo } from "@/media-view/media-info";
import type { MediaInfo } from "@/media-view/media-info";
import type { MxSettings } from "@/settings/def";
import { mediaInfoToURL } from "@/web/url-match";
import { urlTitle } from "../title";

export function insertTimestamp(
  { timestamp, screenshot }: { timestamp: string; screenshot?: string },
  {
    template,
    editor,
    insertBefore,
  }: { template: string; editor: Editor; insertBefore?: boolean },
) {
  console.debug("insert timestamp", { timestamp, screenshot, template });
  let toInsert = template.replace("{{TIMESTAMP}}", timestamp);
  if (screenshot) {
    toInsert = toInsert.replace("{{SCREENSHOT}}", screenshot);
  }
  console.debug("content to insert", toInsert);

  try {
    console.debug(
      `inserting timestamp ${insertBefore ? "before" : "after"} cursor`,
    );
    if (insertBefore) {
      insertBeforeCursor(toInsert, editor);
    } else {
      insertToCursor(toInsert, editor);
    }
  } catch (error) {
    new Notice("Failed to insert timestamp, see console for details");
    console.error("Failed to insert timestamp", error);
  }
}
function insertToCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("to");
  console.debug("insert to cursor [to]", cursor.ch, cursor.line);
  editor.replaceRange(str, cursor, cursor);
  editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}
function insertBeforeCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("from");
  console.debug("insert before cursor [from]", cursor.ch, cursor.line);
  editor.replaceRange(str, cursor, cursor);
  // editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}

export function openOrCreateMediaNote(
  mediaInfo: MediaInfo,
  playerComponent: PlayerComponent,
) {
  const { metadataCache, vault } = playerComponent.plugin.app;
  const player = playerComponent.store.getState().player;
  if (!player) {
    throw new Error("Player not initialized");
  }
  const url = mediaInfoToURL(mediaInfo, vault);
  const title = urlTitle(url, player.state);
  const file = url.getVaultFile(vault);
  const mediaType = url.inferredType ?? ("media" as const);
  if (file) {
    return playerComponent.plugin.leafOpener.openNote(mediaInfo, {
      title,
      fm: (newNotePath) => ({
        [mediaType]: `[[${metadataCache.fileToLinktext(file, newNotePath)}]]`,
      }),
      sourcePath: file.path,
    });
  } else {
    return playerComponent.plugin.leafOpener.openNote(mediaInfo, {
      title,
      fm: () => ({ [mediaType]: url.jsonState.source }),
    });
  }
}

export function timestampGenerator(
  time: number,
  mediaInfo: MediaInfo,
  {
    app: { fileManager },
    settings: { timestampOffset },
    state: { duration },
  }: { app: App; settings: MxSettings; state: Readonly<MediaState> },
): (newNotePath: string) => string {
  time += timestampOffset;
  if (time < 0) time = 0;
  if (duration && time > duration) time = duration;

  const timeInDuration = formatDuration(time);
  const frag =
    time > 0 ? ({ start: time, end: -1 } satisfies TempFragment) : undefined;
  const hash = frag ? `#${toTempFragString(frag)!}` : "";
  if (isFileMediaInfo(mediaInfo)) {
    const { file } = mediaInfo;
    return (newNotePath: string) =>
      fileManager
        .generateMarkdownLink(file, newNotePath, hash, timeInDuration)
        .replace(/^!/, "");
  } else {
    const sourceUrl = mediaInfo.print(frag);
    return () => `[${timeInDuration}](${sourceUrl}${hash})`;
  }
}
