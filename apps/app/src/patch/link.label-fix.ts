import type { Plugin } from "obsidian";

export default function fixLinkLabel(this: Plugin) {
  this.registerMarkdownPostProcessor((el) =>
    el.querySelectorAll("a").forEach((a) => {
      const label = a.getAttr("aria-label");
      if (!label) return;
      try {
        // decode uri to make uri more readable
        const newLabel = decodeURI(label);
        if (label !== newLabel) {
          a.setAttr("aria-label", newLabel);
        }
      } catch {
        // if decode failed, do nothing
      }
    }),
  );
}
