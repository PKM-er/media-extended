import "obsidian";

import {
  getMostRecentViewOfType,
  insertToCursor,
  secondToDuration,
  secondToFragFormat,
} from "@misc";
import type MediaExtended from "@plugin";
import { MediaMeta, Provider } from "@slice/meta/types";
import { MarkdownView, Notice, TFile } from "obsidian";

export const registerInsetTimestampHandler = (plugin: MediaExtended) => {
  plugin.registerEvent(
    plugin.app.workspace.on("mx:timestamp", (time, duration, source) => {
      const mdView = getMostRecentViewOfType(MarkdownView);
      if (!mdView) {
        new Notice("No opened markdown note available to insert timestamp");
        return;
      }
      const timestamp = getTimeStamp(time, duration, source);
      if (!timestamp) return;
      const { timestampTemplate: template } = plugin.settings;
      insertToCursor(template.replace(/{{TIMESTAMP}}/g, timestamp), mdView);
    }),
  );
  const getTimeStamp = (
    currentTime: number,
    duration: number,
    meta: MediaMeta,
  ): string | null => {
    const { timestampOffset: offset } = plugin.settings;
    let offsetCurrentTime = currentTime - offset;
    if (currentTime - offset < 0) offsetCurrentTime = 0;
    else if (currentTime - offset > duration) offsetCurrentTime = duration;

    if (meta.provider === Provider.obsidian) {
      const file = plugin.app.vault.getAbstractFileByPath(meta.file.path);
      let linktext;
      if (
        file instanceof TFile &&
        (linktext = plugin.app.metadataCache.fileToLinktext(file, "", true))
      ) {
        const frag = secondToFragFormat(offsetCurrentTime);
        return `[[${linktext}#t=${frag}]]`;
      } else {
        new Notice("Could not find source file of timestamp: " + meta.file);
        return null;
      }
    } else if (meta.provider) {
      const linktext = secondToDuration(offsetCurrentTime);
      const link = meta.url,
        hash = `#t=${offsetCurrentTime}`;

      let url = link + hash;
      try {
        if (decodeURI(url) !== url) {
          url = `<${decodeURI(url)}>`;
        }
      } catch (error) {
        console.warn("malformed URI: " + url);
      }

      return `[${linktext}](${url})`;
    }
    return null;
  };
};
