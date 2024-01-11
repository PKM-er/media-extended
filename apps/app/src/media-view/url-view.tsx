import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView, Platform, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { toURL } from "@/lib/url";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/utils";
import { setTempFrag } from "./base";
import type { MediaRemoteViewState, PlayerComponent } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_URL_VIEW_TYPE = {
  video: "mx-url-video",
  audio: "mx-url-audio",
};

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

  abstract getViewType(): string;
  abstract getIcon(): string;

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

  protected _title: string | null = null;

  async setState(
    state: MediaUrlViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      this._title = basenameFrom(state.source);
      this.store.setState({
        source: { src: fixFileUrl(state.source) },
        title: this._title,
      });
    }
    return super.setState(state, result);
  }
  getState(): MediaUrlViewState {
    const fromStore = this.store.getState();
    const state = super.getState();
    return {
      ...state,
      source: revertFileUrl(fromStore.source?.src),
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
  getViewType(): string {
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
  getViewType(): string {
    return MEDIA_URL_VIEW_TYPE.audio;
  }
  canAcceptExtension(extension: string): boolean {
    return MediaFileExtensions.audio.includes(extension);
  }
}

function fixFileUrl(url: string): string {
  if (url.startsWith("file:///")) {
    return (
      Platform.resourcePathPrefix +
      url.slice("file:///".length) +
      "?" +
      Date.now()
    );
  }
  return url;
}
function revertFileUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.startsWith(Platform.resourcePathPrefix)) {
    return (
      "file:///" + url.slice(Platform.resourcePathPrefix.length).split("?")[0]
    );
  }
  return url;
}

function basenameFrom(src: string): string {
  const url = toURL(src);
  if (!url) return "";
  const { pathname } = url;
  if (!pathname) return "";
  const finalPath = pathname.split("/").pop();
  if (!finalPath) return "";
  // remove extension
  return decodeURI(finalPath.split(".").slice(0, -1).join("."));
}
