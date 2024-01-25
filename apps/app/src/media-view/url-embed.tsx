import { MarkdownRenderChild } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import { dataLpPassthrough } from "@/components/player/buttons";
import type MxPlugin from "@/mx-main";
import { type PlayerComponent } from "./base";

export class MediaRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  store;
  root: ReactDOM.Root | null = null;

  constructor(public containerEl: HTMLElement, public plugin: MxPlugin) {
    super(containerEl);
    this.store = createMediaViewStore();
    containerEl.addClasses([
      "mx",
      "custom",
      "mx-media-embed",
      "mx-external-link-embed",
    ]);
    function isEditButton(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false;
      const button = target.closest("button");
      if (!button) return false;
      return button.hasAttribute(dataLpPassthrough);
    }
    this.registerDomEvent(containerEl, "click", (evt) => {
      // only allow edit button to propagate to lp click handler
      if (!isEditButton(evt.target)) evt.stopImmediatePropagation();
    });
  }

  update({ hash, src }: Partial<{ hash: string; src: string }>): void {
    const hashFacet = hash ? { hash } : {};
    const srcFacet = src ? { source: { src } } : {};
    this.store.setState({ ...hashFacet, ...srcFacet });
  }

  onload(): void {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.containerEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
          embed: true,
        }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }

  onunload() {
    // unmount before detach from DOM
    this.root?.unmount();
    this.root = null;
    super.onunload();
  }
}
