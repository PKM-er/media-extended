import type MediaExtended from "@/mx-main";

import defineStatefulDecoration from "./state";

export default function setupEmbedWidget(plugin: MediaExtended) {
  plugin.registerEditorExtension(defineStatefulDecoration(plugin));
}
