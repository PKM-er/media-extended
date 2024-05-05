import type { Menu, TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import type { FileMediaInfo } from "@/info/media-info";
import { checkMediaType } from "@/info/media-type";
import type { PaneMenuSource } from "@/lib/menu";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";
import { type PlayerComponent, addAction, onPaneMenu } from "./base";
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
  get player() {
    return this.store.getState().player;
  }
  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createMediaViewStore(plugin);
    this.scope = new Scope(this.app.scope);
    this.contentEl.addClasses(["mx", "custom"]);
    addAction(this);
  }

  onload(): void {
    handleWindowMigration(this, () => this.render());
  }

  abstract getViewType(): MediaFileViewType;
  abstract getIcon(): string;
  abstract getMediaInfo(): FileMediaInfo | null;

  async onLoadFile(file: TFile): Promise<void> {
    await this.store.getState().loadFile(file, {
      vault: this.app.vault,
    });
  }
  onPaneMenu(menu: Menu, menuSource: PaneMenuSource): void {
    super.onPaneMenu(menu, menuSource);
    onPaneMenu(this, menu, menuSource);
  }
  abstract canAcceptExtension(extension: string): boolean;

  setEphemeralState(state: any): void {
    if ("subpath" in state) {
      const { subpath } = state;
      this.store.getState().setHash(subpath);
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
          reload: () => this.render(),
          onPlaylistChange: (item) => {
            this.plugin.leafOpener.openMediaIn(this.leaf, item.media);
          },
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
    };
  }
  getViewType() {
    return MEDIA_FILE_VIEW_TYPE.video;
  }
  canAcceptExtension(extension: string): boolean {
    return checkMediaType(extension) === "video";
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
    };
  }
  canAcceptExtension(extension: string): boolean {
    return checkMediaType(extension) === "audio";
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
