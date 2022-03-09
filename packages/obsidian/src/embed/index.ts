import type MediaExtended from "../mx-main";
import getEmbedProcessor from "./preview";

const registerEmbedHandlers = (plugin: MediaExtended) => {
  if (plugin.settings.extendedImageEmbedSyntax) {
    plugin.registerMarkdownPostProcessor(getEmbedProcessor("external", plugin));
  }
  if (plugin.settings.mediaFragmentsEmbed) {
    plugin.registerMarkdownPostProcessor(getEmbedProcessor("internal", plugin));
  }
};
export default registerEmbedHandlers;
