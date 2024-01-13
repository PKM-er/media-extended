import type { TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { getTracks } from "@/lib/subtitle";
import { handleWindowMigration } from "@/lib/window-migration";
import { takeTimestampOnFile } from "@/media-note/timestamp";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/utils";
import { setTempFrag, type PlayerComponent } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_FILE_VIEW_TYPE = {
  video: "mx-file-video",
  audio: "mx-file-audio",
} as const;

const viewTypes = new Set(Object.values(MEDIA_FILE_VIEW_TYPE));

export type MediaFileViewType =
  (typeof MEDIA_FILE_VIEW_TYPE)[keyof typeof MEDIA_FILE_VIEW_TYPE];

export function isMediaFileViewType(type: string): type is MediaFileViewType {
  return viewTypes.has(type as any);
}

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
    this.addAction(
      "star",
      "Timestamp",
      takeTimestampOnFile(this, (player) => player.file),
    );

    this.register(
      this.containerEl.onWindowMigrated(() => {
        this.render();
      }),
    );
  }

  abstract getViewType(): string;
  abstract getIcon(): string;

  async onLoadFile(file: TFile): Promise<void> {
    const { vault } = this.app;
    const src = this.app.vault.getResourcePath(file);
    const textTracks = await getTracks(file, vault);
    this.store.setState({ source: { src }, textTracks, title: file.name });
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
  getViewType(): string {
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
  getViewType(): string {
    return MEDIA_FILE_VIEW_TYPE.audio;
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
