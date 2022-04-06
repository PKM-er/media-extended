import type MediaExtended from "@plugin";
import setupEmbedWidget from "@render/embed-widget";

import patchMediaEmbed from "./patch";
import getEmbedProcessor from "./preview";

const registerEmbedHandlers = (plugin: MediaExtended) => {
  if (plugin.settings.extendedImageEmbedSyntax) {
    plugin.registerMarkdownPostProcessor(getEmbedProcessor("external", plugin));
  }
  plugin.registerMarkdownPostProcessor(getEmbedProcessor("internal", plugin));
  patchMediaEmbed(plugin);
  plugin.app.workspace.onLayoutReady(() => setupEmbedWidget(plugin));
};
export default registerEmbedHandlers;
