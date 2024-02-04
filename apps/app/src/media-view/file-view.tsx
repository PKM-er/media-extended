import type { Menu, TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { getTracks } from "@/lib/subtitle";
import { handleWindowMigration } from "@/lib/window-migration";
import type { FileMediaInfo } from "@/media-note/note-index/file-info";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/media-type";
import { setTempFrag, type PlayerComponent, addAction } from "./base";
import type { MediaFileViewType } from "./view-type";
import { MEDIA_FILE_VIEW_TYPE } from "./view-type";

abstract class MediaFileView
  extends EditableFileView
  implements PlayerComponent
{
  allowNoFile = false;
  // inherit from EditableFileView, no need to set explicitly
  // navigation = true

  // no need to manage scope manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  store;
  scope: Scope;
  root: ReactDOM.Root | null = null;
  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createMediaViewStore();
    this.scope = new Scope(this.app.scope);
    this.contentEl.addClasses(["mx", "custom"]);
    handleWindowMigration.call(this, () => this.render());
    addAction(this);

    this.register(
      this.containerEl.onWindowMigrated(() => {
        this.render();
      }),
    );
  }

  abstract getViewType(): MediaFileViewType;
  abstract getIcon(): string;
  abstract getMediaInfo(): FileMediaInfo | null;

  async onLoadFile(file: TFile): Promise<void> {
    const { vault } = this.app;
    const src = this.app.vault.getResourcePath(file);
    const textTracks = await getTracks(file, vault);
    this.store.setState({
      source: { src, original: file.path, viewType: this.getViewType() },
      textTracks,
      title: file.name,
    });
  }
  onPaneMenu(
    menu: Menu,
    menuSource: "sidebar-context-menu" | "tab-header" | "more-options",
  ): void {
    super.onPaneMenu(menu, menuSource);
    const {
      player,
      source,
      toggleControls,
      controls,
      hash,
      transform,
      setTransform,
    } = this.store.getState();
    if (!player || !source) return;
    this.app.workspace.trigger(
      "mx-media-menu",
      menu,
      {
        controls,
        player,
        source,
        toggleControls,
        hash,
        setTransform,
        transform,
      },
      menuSource,
      this.leaf,
    );
  }
  abstract canAcceptExtension(extension: string): boolean;

  initialEphemeralState = true;
  setEphemeralState(state: any): void {
    if ("subpath" in state) {
      const { subpath } = state;
      if (this.initialEphemeralState === true) {
        setTempFrag(subpath, this.store, true);
        this.initialEphemeralState = false;
      } else {
        setTempFrag(subpath, this.store);
      }
    }
    super.setEphemeralState(state);
  }

  protected async onOpen(): Promise<void> {
    await super.onOpen();
    this.render();
  }
  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.contentEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
          embed: false,
        }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
    return super.onClose();
  }
}

export class VideoFileView extends MediaFileView {
  getIcon(): string {
    return "file-video";
  }
  getMediaInfo(): FileMediaInfo | null {
    if (!this.file) return null;
    return {
      type: "video",
      file: this.file,
      hash: this.getEphemeralState().subpath,
      viewType: this.getViewType(),
    };
  }
  getViewType() {
    return MEDIA_FILE_VIEW_TYPE.video;
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.video.includes(extension);
  }
}

export class AudioFileView extends MediaFileView {
  getIcon(): string {
    return "file-audio";
  }
  getViewType() {
    return MEDIA_FILE_VIEW_TYPE.audio;
  }
  getMediaInfo(): FileMediaInfo | null {
    if (!this.file) return null;
    return {
      type: "audio",
      file: this.file,
      hash: this.getEphemeralState().subpath,
      viewType: this.getViewType(),
    };
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.audio.includes(extension);
  }
}

// function clearMediaSrc<T extends HTMLElement>(containerEl: T) {
//   containerEl.findAll("audio, video").forEach((element) => {
//     if (element instanceof HTMLMediaElement) {
//       element.src = "";
//       element.srcObject = null;
//     }
//   });
// }
