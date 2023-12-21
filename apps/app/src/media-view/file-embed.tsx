import type { EmbedComponent, EmbedInfo, TFile } from "obsidian";
import { Component } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import type MxPlugin from "@/mx-main";
import type { PlayerComponent } from "./base";

export class MediaFileEmbed
  extends Component
  implements EmbedComponent, PlayerComponent
{
  store;
  root: ReactDOM.Root | null = null;
  constructor(
    public info: EmbedInfo,
    public file: TFile,
    public subpath: string,
    public plugin: MxPlugin,
  ) {
    super();
    this.store = createMediaViewStore();
    this.store.setState({ hash: subpath });
    const { containerEl } = info;
    containerEl.addClasses(["mx", "mx-media-embed", "custom"]);
    containerEl.style.display = "contents";
  }

  onload(): void {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.info.containerEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{ plugin: this.plugin, store: this.store }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }

  loadFile() {
    this.store.setState({
      source: {
        src: this.info.app.vault.getResourcePath(this.file),
        // explicitly set type for webm files to trigger audio detection
        type: this.file.extension === "webm" ? "video/webm" : undefined,
      },
    });
  }

  onunload() {
    super.onunload();
    this.root?.unmount();
    this.root = null;
  }
}
