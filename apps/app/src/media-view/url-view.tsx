import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/media-type";
import { matchHostForUrl } from "@/web/match-url";
import { setTempFrag, titleFromUrl } from "./base";
import type { MediaRemoteViewState, PlayerComponent } from "./base";
import type { MediaUrlViewType } from "./view-type";
import { MEDIA_URL_VIEW_TYPE } from "./view-type";

export type MediaUrlViewState = MediaRemoteViewState;

abstract class MediaUrlView extends ItemView implements PlayerComponent {
  allowNoFile = false;
  navigation = true;

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

  abstract getViewType(): MediaUrlViewType;
  abstract getIcon(): string;

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

  protected _title: string | null = null;

  async setState(
    state: MediaUrlViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      const info = matchHostForUrl(state.source);
      if (!info) {
        console.warn("Invalid URL", state.source);
      } else {
        this._title = titleFromUrl(info.source.href);
        this.store.setState({
          source: {
            src: info.source.href,
            original: state.source,
            viewType: this.getViewType(),
          },
          title: this._title,
        });
      }
    }
    return super.setState(state, result);
  }
  getState(): MediaUrlViewState {
    const state = super.getState();
    return {
      ...state,
      source: this.store.getState().source?.original,
    };
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
    return super.onClose();
  }
}

export class VideoUrlView extends MediaUrlView {
  getIcon(): string {
    return "file-video";
  }
  getViewType() {
    return MEDIA_URL_VIEW_TYPE.video;
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Video";
    return title;
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.video.includes(extension);
  }
}

export class AudioUrlView extends MediaUrlView {
  getIcon(): string {
    return "file-audio";
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Audio";
    return title;
  }
  getViewType() {
    return MEDIA_URL_VIEW_TYPE.audio;
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.audio.includes(extension);
  }
}

// function revertFileUrl(url?: string): string | undefined {
//   if (!url) return url;
//   if (url.startsWith(Platform.resourcePathPrefix)) {
//     return (
//       "file:///" + url.slice(Platform.resourcePathPrefix.length).split("?")[0]
//     );
//   }
//   return url;
// }
