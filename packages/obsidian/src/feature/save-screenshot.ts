import "obsidian";

import { getBasename, getFilename } from "@base/url-parse/misc";
import { getMostRecentViewOfType, insertToCursor } from "@misc/obsidian";
import type MediaExtended from "@plugin";
import { MediaMeta, Provider } from "@slice/meta/types";
import filenamify from "filenamify/browser";
import { MarkdownView, moment, Notice } from "obsidian";
import URLParse from "url-parse";

const toDurationString = (duration: number) =>
  duration === 0 ? "DT0S" : moment.duration(duration, "seconds").toISOString();

const getScreenshotName = (meta: MediaMeta, time: number) => {
  const timestamp = toDurationString(time);
  let name: string;
  if (meta.provider === Provider.obsidian) {
    name = meta.title ?? meta.file.basename;
  } else if (meta.provider === Provider.html5) {
    if (meta.title) name = meta.title;
    else {
      const url = new URLParse(meta.url),
        filename = getFilename(url.pathname);
      if (filename) {
        name = getBasename(filename);
      } else {
        name = url.hostname + "-" + url.pathname;
      }
    }
  } else if (meta.provider) {
    name = meta.title ?? meta.id ?? Date.now().toString();
  } else {
    throw new Error("no provider");
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

      const mdView = getMostRecentViewOfType(MarkdownView);
      if (!mdView) return;

      const linktext = plugin.app.fileManager.generateMarkdownLink(
        file,
        mdView.file.path,
      );
      insertToCursor(linktext, mdView);
    }),
  );
};
