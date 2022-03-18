import type MediaExtended from "../mx-main";
import defineStatefulDecoration from "./state";

const setupEmbedWidget = (plugin: MediaExtended) => {
  plugin.registerEditorExtension(defineStatefulDecoration(plugin));
};
export default setupEmbedWidget;
