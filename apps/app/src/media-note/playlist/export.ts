import { pathToFileURL } from "url";
import type { Vault } from "obsidian";
import { FileSystemAdapter, Notice } from "obsidian";

import { isFileMediaInfo, getMediaInfoID } from "@/info/media-info";
import { MediaURL } from "@/info/media-url";
import type { Playlist } from "./def";

export function generateM3U8File(playlist: Playlist, vault: Vault) {
  // Start of the M3U8 file
  let m3u8Content = "#EXTM3U\n";

  // Iterate over the playlist items and add them to the file content
  const skippedItems: string[] = [];
  let fileNotSupported = false;
  for (const item of playlist.list) {
    if (item.media instanceof MediaURL) {
      // Ensure there's a media URL
      m3u8Content += `#EXTINF:-1,${item.title}\n${item.media.href}\n`;
    } else if (isFileMediaInfo(item.media)) {
      if (vault.adapter instanceof FileSystemAdapter) {
        const fileFullPath = vault.adapter.getFullPath(item.media.file.path);
        try {
          const fileUrl = pathToFileURL(fileFullPath).href;
          m3u8Content += `#EXTINF:-1,${item.title}\n${fileUrl}\n`;
        } catch (e) {
          new Notice(`Failed to convert file path to URL: ${e}`);
          skippedItems.push(item.title || getMediaInfoID(item.media));
        }
      } else {
        fileNotSupported = true;
        skippedItems.push(item.title || getMediaInfoID(item.media));
      }
    }
  }
  if (skippedItems.length > 0) {
    if (fileNotSupported) {
      new Notice(
        createFragment((f) => {
          f.createDiv({
            text: `File URI is not supported in this environment. `,
          });
          f.createDiv({ text: `Skipped items: ${skippedItems.join(", ")}` });
        }),
      );
    } else {
      new Notice(`Skipped items: ${skippedItems.join(", ")}`);
    }
  }

  // Convert the file content to a Blob
  saveM3U8(m3u8Content, playlist.title);
}
function saveM3U8(m3u8Content: string, title: string) {
  const blob = new Blob([m3u8Content], {
    type: "application/vnd.apple.mpegurl",
  });

  // Create a temporary anchor element to trigger the download
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.m3u8`;

  // Append the anchor to the body, click it, and then remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
