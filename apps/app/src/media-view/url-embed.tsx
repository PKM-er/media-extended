import { MarkdownRenderChild } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import { getTracksLocal } from "@/lib/subtitle";
import type MxPlugin from "@/mx-main";
import type { MediaURL } from "@/web/url-match";
import { type PlayerComponent } from "./base";
import { MEDIA_URL_VIEW_TYPE } from "./view-type";

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

  async setSource(
    media: MediaURL,
    other: Partial<{ title: string; hash: string }> = {},
  ) {
    const viewType = this.plugin.urlViewType.getPreferred(media);
    const defaultLang = this.plugin.settings.getState().getDefaultLang();
    this.store.getState().setSource(media, {
      title: other.title ?? true,
      hash: other.hash,
      viewType,
      textTracks:
        viewType === MEDIA_URL_VIEW_TYPE.video
          ? await getTracksLocal(media, defaultLang).catch((e) => {
              console.error(
                "Failed to get text tracks",
                e,
                media.href,
                defaultLang,
              );
              return [];
            })
          : [],
    });
  }

  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.containerEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
          reload: () => this.render(),
          embed: true,
        }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }
  onload(): void {
    super.onload();
    this.render();
  }

  onunload() {
    // unmount before detach from DOM
    this.root?.unmount();
    this.root = null;
    super.onunload();
  }
}
