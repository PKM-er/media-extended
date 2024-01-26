import type { MediaPlayerInstance } from "@vidstack/react";
import { around } from "monkey-around";
import type { Component, WorkspaceLeaf, Menu } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import type { MediaViewStoreApi } from "@/components/context";
import {
  createMediaViewStore,
  MediaViewContext,
  onPlayerMounted,
} from "@/components/context";
import { Player } from "@/components/player";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { toURL } from "@/lib/url";
import { handleWindowMigration } from "@/lib/window-migration";
import { parseUrl } from "@/media-note/note-index/url-info";
import { takeTimestampOnUrl } from "@/media-note/timestamp";
import type MediaExtended from "@/mx-main";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  containerEl: HTMLElement;
  root: ReactDOM.Root | null;
}

export async function setTempFrag(
  hash: string,
  store: MediaViewStoreApi,
  initial = false,
) {
  store.setState({ hash });
  const tf = parseTempFrag(hash);
  if (!tf) return;
  const player = await new Promise<MediaPlayerInstance>((resolve) => {
    const player = store.getState().player;
    if (player) resolve(player);
    else {
      const unsubscribe = store.subscribe(({ player }) => {
        if (player) {
          unsubscribe();
          resolve(player);
        }
      });
    }
  });
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let _newTime: number | null = null;
  // allow 0.25s offset from end, in case delay in seeking
  const allowedOffset = 0.25;
  if (
    isTimestamp(tf) ||
    player.currentTime < tf.start ||
    Math.abs(player.currentTime - tf.end) < allowedOffset
  ) {
    _newTime = tf.start;
  } else if (player.currentTime - allowedOffset > tf.end) {
    _newTime = tf.end;
  }
  if (_newTime !== null) {
    const newTime = _newTime;
    if (!player.state.canPlay) {
      // trying to fix youtube and vimeo autoplay on seek
      if (
        ["video/vimeo", "video/youtube"].includes(player.state.source.type) &&
        !player.state.autoplay
      ) {
        await Promise.race([
          waitFor(player, "can-play"),
          waitFor(player, "canplay"),
        ]);
        player.play();
        await waitFor(player, "play");
        await Promise.race([
          waitFor(player, "time-update"),
          waitFor(player, "timeupdate"),
        ]);
        player.pause();
        player.currentTime = newTime;
      } else {
        await Promise.race([
          waitFor(player, "can-play"),
          waitFor(player, "canplay"),
        ]);
        player.currentTime = newTime;
      }
    } else {
      player.currentTime = newTime;
    }
  }

  if (isTimestamp(tf) && player.state.canPlay && !initial) {
    player.play(new Event("hashchange"));
  }
}

declare module "obsidian" {
  interface View {
    titleEl: HTMLElement;
  }
  interface WorkspaceLeaf {
    updateHeader(): void;
  }
  interface Workspace {
    requestActiveLeafEvents(): boolean;
  }
}

export interface MediaRemoteViewState {
  source?: string;
}

export abstract class MediaRemoteView
  extends ItemView
  implements PlayerComponent
{
  // no need to manage scope manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  store;
  scope: Scope;
  root: ReactDOM.Root | null = null;
  navigation = true;
  protected _title = "";
  protected _sourceType = "";

  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createMediaViewStore();
    this.scope = new Scope(this.app.scope);
    this.contentEl.addClasses(["mx", "custom"]);
    // this.register(
    //   this.containerEl.onWindowMigrated(() => {
    //     this.render();
    //   }),
    // );
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.addAction(
      "star",
      "Timestamp",
      takeTimestampOnUrl(this, (player) =>
        parseUrl(player.store.getState().source?.original),
      ),
    );

    // make sure to unmount the player before the leaf detach it from DOM
    this.register(
      around(this.leaf, {
        detach: (next) =>
          function (this: WorkspaceLeaf, ...args) {
            self.root?.unmount();
            self.root = null;
            return next.call(this, ...args);
          },
      }),
    );

    handleWindowMigration.call(this, () => this.render());
    this.register(
      onPlayerMounted(this.store, (player) =>
        player.subscribe(({ title, source }) => {
          this._title = title;
          this._sourceType = source.type;
          this.updateTitle();
        }),
      ),
    );
  }

  abstract getViewType(): string;
  abstract getIcon(): string;
  abstract getDisplayText(): string;

  initialEphemeralState = true;

  onPaneMenu(
    menu: Menu,
    menuSource: "sidebar-context-menu" | "tab-header" | "more-options",
  ): void {
    super.onPaneMenu(menu, menuSource);
    const { player, source, toggleControls, controls, hash } =
      this.store.getState();
    if (!player || !source) return;
    this.app.workspace.trigger(
      "mx-media-menu",
      menu,
      { source, player, toggleControls, controls, hash },
      menuSource,
      this.leaf,
    );
  }

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

  updateTitle() {
    const newTitle = this.getDisplayText();
    this.titleEl.setText(newTitle);

    if (
      // eslint-disable-next-line deprecation/deprecation
      this.app.workspace.activeLeaf === this.leaf &&
      this.app.workspace.requestActiveLeafEvents()
    ) {
      this.leaf.updateHeader();
    }
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

  close() {
    this.root?.unmount();
    this.root = null;
    // @ts-expect-error -- this would call leaf.detach()
    return super.close();
  }
  async onClose() {
    this.root?.unmount();
    this.root = null;
    return super.onClose();
  }
}

function waitFor(
  player: MediaPlayerInstance,
  event: "time-update" | "play" | "can-play" | "canplay" | "timeupdate",
) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve();
      unload();
    }, 5e3);
    const unload = player.listen(event, () => {
      resolve();
      window.clearTimeout(timeout);
      unload();
    });
  });
}

export function titleFromUrl(src: string): string {
  const url = toURL(src);
  if (!url) return "";
  const { pathname } = url;
  if (!pathname) return "";
  const finalPath = pathname.split("/").pop();
  if (!finalPath) return "";
  // remove extension
  return decodeURI(finalPath.split(".").slice(0, -1).join("."));
}
