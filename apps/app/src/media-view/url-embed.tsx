import { MarkdownRenderChild } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import type MxPlugin from "@/mx-main";
import type { MediaURL } from "@/web/url-match";
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
    containerEl.addClasses(["mx", "custom", "mx-media-embed"]);
  }

  getMediaInfo() {
    return this.store.getState().source?.url ?? null;
  }

  update({ source, enableWebview, ...rest }: Partial<StateFacet>): void {
    this.store.setState({
      ...rest,
      source: source ? { url: source, enableWebview } : undefined,
    });
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

export interface StateFacet {
  hash: string;
  title: string;
  source: MediaURL;
  enableWebview: boolean;
}
