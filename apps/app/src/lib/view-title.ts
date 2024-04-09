import type { View } from "obsidian";

export function updateTitle(this: View) {
  const newTitle = this.getDisplayText();
  this.titleEl.setText(newTitle);

  if (
    // eslint-disable-next-line deprecation/deprecation
    this.app.workspace.activeLeaf === this.leaf &&
    this.app.workspace.requestActiveLeafEvents()
  ) {
    this.leaf.updateHeader();
  }
}
