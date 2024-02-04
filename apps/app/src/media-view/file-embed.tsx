import type { EmbedComponent, EmbedInfo, TFile } from "obsidian";
import { Component } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import { dataLpPassthrough } from "@/components/player/buttons";
import { getTracks } from "@/lib/subtitle";
import type { FileMediaInfo } from "@/media-note/note-index/file-info";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/media-type";
import { type PlayerComponent } from "./base";
import { MEDIA_FILE_VIEW_TYPE } from "./view-type";

export class MediaFileEmbed
  extends Component
  implements EmbedComponent, PlayerComponent
{
  store;
  root: ReactDOM.Root | null = null;
  public containerEl: HTMLElement;
  constructor(
    public info: EmbedInfo,
    public file: TFile,
    public subpath: string,
    public plugin: MxPlugin,
  ) {
    super();
    this.containerEl = info.containerEl;
    this.store = createMediaViewStore();
    this.store.setState({ hash: subpath, title: file.name });
    const { containerEl } = info;
    containerEl.addClasses(["mx", "mx-media-embed", "custom"]);
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
    // containerEl.style.display = "contents";
  }

  getMediaInfo(): FileMediaInfo | null {
    if (!this.file) return null;
    const type = checkMediaType(this.file.extension);
    if (!type) return null;
    return {
      type,
      file: this.file,
      hash: this.subpath,
      viewType: MEDIA_FILE_VIEW_TYPE[type],
    };
  }

  onload(): void {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.info.containerEl);
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

  async loadFile() {
    const textTracks = await getTracks(this.file, this.info.app.vault);
    const mediaType = checkMediaType(this.file.extension);
    if (!mediaType)
      throw new Error(`Unknown media type ${this.file.extension}`);
    this.store.setState({
      source: {
        src: this.info.app.vault.getResourcePath(this.file),
        original: this.file.path,
        viewType: MEDIA_FILE_VIEW_TYPE[mediaType],
        // explicitly set type for webm files to trigger audio detection
        type: this.file.extension === "webm" ? "video/webm" : undefined,
      },
      textTracks,
    });
  }

  onunload() {
    // unmount before detach from DOM
    this.root?.unmount();
    this.root = null;
    super.onunload();
  }
}
