import type MediaExtended from "../mx-main";
import { patchEditorClick } from "./editor";
import patchPreviewLinks from "./preview";

const registerLinkHandlers = (plugin: MediaExtended) => {
  patchEditorClick(plugin);
  patchPreviewLinks(plugin);
};
export default registerLinkHandlers;
