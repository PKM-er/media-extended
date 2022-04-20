import "obsidian";

import { getMostRecentViewOfType, insertToCursor } from "@misc";
import type MediaExtended from "@plugin";
import { Source } from "@slice/provider-types";
import filenamify from "filenamify/browser";
import { MarkdownView, moment, Notice } from "obsidian";
import URLParse from "url-parse";

const toDurationString = (duration: number) =>
  duration === 0 ? "DT0S" : moment.duration(duration, "seconds").toISOString();

const getScreenshotName = (source: Source, time: number) => {
  const timestamp = toDurationString(time);
  let name: string;
  if (source.from === "obsidian") {
    name = source.title ?? source.basename;
  } else if (source.from === "direct") {
    if (source.title) name = source.title;
    else {
      const url = new URLParse(source.src);
      name = url.pathname.split("/").pop() ?? url.hostname + "-" + url.pathname;
    }
  } else {
    name = source.title ?? source.id;
  }
  return filenamify(name) + timestamp;
};

export const registerSaveScreenshotHandler = (plugin: MediaExtended) => {
  plugin.registerEvent(
    plugin.app.workspace.on("mx:screenshot", async (ab, time, ext, source) => {
      console.log(time, source);
      const path = await app.vault.getAvailablePathForAttachments(
        getScreenshotName(source, time),
        ext,
        app.workspace.getActiveFile(),
      );
      const file = await app.vault.createBinary(path, ab);
      new Notice(`Saved screenshot to ${path}`);

      const mdView = getMostRecentViewOfType(MarkdownView, plugin.app);
      if (!mdView) return;

      const linktext = plugin.app.fileManager.generateMarkdownLink(
        file,
        mdView.file.path,
      );
      insertToCursor(linktext, mdView);
    }),
  );
};
