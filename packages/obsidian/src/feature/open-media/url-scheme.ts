import MediaExtended from "@plugin";
import { Notice } from "obsidian";

import { openMediaLink } from "./open-media";

export const registerURLHandler = (plugin: MediaExtended) => {
  plugin.registerObsidianProtocolHandler("open-media", async (param) => {
    if (
      typeof param.link === "string" &&
      (!("vault" in param) || app.vault.getName() === param.vault)
    ) {
      if (await openMediaLink(param.link, true)) {
        new Notice("Opened media: " + param.link);
      } else {
        new Notice("Link not supported");
      }
    } else {
      new Notice("Failed to open media: Invalid link");
    }
  });
};
