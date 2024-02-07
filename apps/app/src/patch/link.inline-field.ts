import { around } from "monkey-around";
import { Keymap, MarkdownView } from "obsidian";
import { parseUrl } from "@/media-note/note-index/url-info";
import type MxPlugin from "@/mx-main";

export default function patchInlineUrl(this: MxPlugin) {
  const clickHandler = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLDivElement)) return;
    if (!e.target.matches(".metadata-link-inner.external-link")) return;
    const urlInfo = parseUrl(e.target.textContent, this);
    if (!urlInfo) return;
    e.stopImmediatePropagation();
    this.leafOpener.openMedia(urlInfo, Keymap.isModEvent(e) ? true : "split");
  };
  const unload = around(MarkdownView.prototype, {
    onload: (next) =>
      function (this: MarkdownView) {
        this.registerDomEvent(this.containerEl, "click", clickHandler, {
          capture: true,
        });
        return next.call(this);
      },
  });
  this.register(() => {
    unload();
    this.app.workspace
      .getLeavesOfType("markdown")
      .forEach((leaf) =>
        leaf.view.containerEl.removeEventListener("click", clickHandler),
      );
  });
}
