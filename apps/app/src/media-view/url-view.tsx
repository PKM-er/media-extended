import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { createMediaViewStore, MediaViewContext } from "@/components/context";
import { Player } from "@/components/player";
import { toURL } from "@/lib/url";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";
import { MediaFileExtensions } from "@/patch/utils";
import { matchHostForUrl } from "@/web/match-url";
import { setTempFrag } from "./base";
import type { MediaRemoteViewState, PlayerComponent } from "./base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_URL_VIEW_TYPE = {
  video: "mx-url-video",
  audio: "mx-url-audio",
} as const;
export type MediaUrlViewType =
  (typeof MEDIA_URL_VIEW_TYPE)[keyof typeof MEDIA_URL_VIEW_TYPE];

const viewTypes = new Set(Object.values(MEDIA_URL_VIEW_TYPE));

export function isMediaUrlViewType(type: string): type is MediaUrlViewType {
  return viewTypes.has(type as any);
}

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
  protected _source: string | null = null;
  get source(): string | null {
    return this._source;
  }

  async setState(
    state: MediaUrlViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      this._title = basenameFrom(state.source);
      const info = matchHostForUrl(state.source);
      this._source = state.source;
      if (!info) {
        this._source = null;
        console.warn("Invalid URL", state.source);
      } else {
        this._source = state.source;
        this.store.setState({
          source: { src: info.source.href },
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
      source: this._source,
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

// function revertFileUrl(url?: string): string | undefined {
//   if (!url) return url;
//   if (url.startsWith(Platform.resourcePathPrefix)) {
//     return (
//       "file:///" + url.slice(Platform.resourcePathPrefix.length).split("?")[0]
//     );
//   }
//   return url;
// }

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
