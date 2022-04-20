import "obsidian";

import {
  getMostRecentViewOfType,
  insertToCursor,
  secondToFragFormat,
  stripHash,
} from "@misc";
import type MediaExtended from "@plugin";
import { Source } from "@slice/provider-types";
import { MarkdownView, Notice, TFile } from "obsidian";

export const registerInsetTimestampHandler = (plugin: MediaExtended) => {
  plugin.registerEvent(
    plugin.app.workspace.on("mx:timestamp", (time, duration, source) => {
      const mdView = getMostRecentViewOfType(MarkdownView, plugin.app);
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
    source: Source,
  ): string | null => {
    const { timestampOffset: offset } = plugin.settings;
    let offsetCurrentTime = currentTime - offset;
    if (currentTime - offset < 0) offsetCurrentTime = 0;
    else if (currentTime - offset > duration) offsetCurrentTime = duration;
    const display = secondToFragFormat(offsetCurrentTime);

    if (source.from === "obsidian") {
      const file = plugin.app.vault.getAbstractFileByPath(source.path);
      let linktext;
      if (
        file instanceof TFile &&
        (linktext = plugin.app.metadataCache.fileToLinktext(file, "", true))
      ) {
        return `[[${linktext}#t=${display}]]`;
      } else {
        new Notice("Could not find source file of timestamp: " + source.path);
        return null;
      }
    } else {
      return (
        `[${display.replace(/\.\d+$/, "")}]` +
        `(${stripHash(source.src)[0]}#t=${offsetCurrentTime})`
      );
    }
  };
};
