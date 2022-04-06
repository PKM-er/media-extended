import type MediaExtended from "@plugin";

import defineStatefulDecoration from "./state";

const setupEmbedWidget = (plugin: MediaExtended) => {
  plugin.registerEditorExtension(defineStatefulDecoration(plugin));
};
export default setupEmbedWidget;
