import type { TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/utils";
import { setTempFrag, type PlayerComponent } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_FILE_VIEW_TYPE = {
  VIDEO: "mx-file-video",
  AUDIO: "mx-file-audio",
};

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
    this.register(
      this.containerEl.onWindowMigrated(() => {
        this.render();
      }),
    );
  }

  abstract getViewType(): string;
  abstract getIcon(): string;

  async onLoadFile(file: TFile): Promise<void> {
    const src = this.app.vault.getResourcePath(file);
    this.store.setState({ source: { src }, title: file.name });
  }
  abstract canAcceptExtension(extension: string): boolean;

  setEphemeralState(state: any): void {
    const { subpath = "" } = state;
    setTempFrag(subpath, this.store);
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
  getViewType(): string {
    return MEDIA_FILE_VIEW_TYPE.VIDEO;
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.video.includes(extension);
  }
}

export class AudioFileView extends MediaFileView {
  getIcon(): string {
    return "file-audio";
  }
  getViewType(): string {
    return MEDIA_FILE_VIEW_TYPE.AUDIO;
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
