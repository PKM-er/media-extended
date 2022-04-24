import type MediaExtended from "@plugin";

import Prompt from "./open-link-modal";

const commandId = "open-media-link";
export const PromptToOpenMediaLink = (evt: Event) => {
  app.commands.executeCommandById("media-extended:" + commandId, evt);
};
export const registerCommand = (plugin: MediaExtended) => {
  plugin.addCommand({
    id: commandId,
    name: "Open Media from Link",
    callback: () => {
      new Prompt(plugin).open();
    },
  });
};
