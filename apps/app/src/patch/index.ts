import type { LinkEvent } from "./event";
import type MediaExtended from "@/mx-main";
import patchEditorClick from "./link.editor";
import patchPreviewClick from "./link.preview";

export default function patchClickAction(
  this: MediaExtended,
  events: Partial<LinkEvent>
) {
  patchEditorClick(this, events);
  patchPreviewClick(this, events);
}
