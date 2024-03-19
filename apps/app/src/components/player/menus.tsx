import "./menu.css";

import {
  useCaptionOptions,
  useMediaPlayer,
  useMediaState,
} from "@vidstack/react";
import { around } from "monkey-around";
import type { MenuItem } from "obsidian";
import { Menu } from "obsidian";
import { useRef } from "react";
import { MoreIcon, PlaylistIcon, SubtitlesIcon } from "@/components/icon";
import { showAtButton } from "@/lib/menu";
import { compare } from "@/media-note/note-index/def";
import type { PlaylistItem } from "@/media-note/playlist/def";
import { isWithMedia } from "@/media-note/playlist/def";
import {
  useApp,
  useIsEmbed,
  useMediaViewStore,
  useMediaViewStoreInst,
  usePlaylistChange,
  usePlugin,
  useReload,
} from "../context";
import { usePlaylist } from "../hook/use-playlist";
import { dataLpPassthrough } from "./buttons";
import { addItemsToMenu } from "./playlist-menu";

function useMenu(onMenu: (menu: Menu) => boolean) {
  const menuRef = useRef<Menu | null>(null);
  return (evt: React.MouseEvent) => {
    menuRef.current?.close();
    menuRef.current = null;
    const menu = new Menu();
    if (onMenu(menu)) {
      showAtButton(evt.nativeEvent, menu);
      evt.nativeEvent.stopImmediatePropagation();
      around(menu, {
        close: (next) =>
          function (this: Menu, ...args) {
            if (menuRef.current === this) menuRef.current = null;
            return next.call(this, ...args);
          },
      });
      menuRef.current = menu;
    } else {
      menu.close();
    }
  };
}

export function Playlist() {
  const playlist = usePlaylist();
  const onPlaylistChange = usePlaylistChange();
  const current = useMediaViewStore((s) => s.source?.url);
  const app = useApp();
  const onClick = useMenu((mainMenu) => {
    if (!onPlaylistChange || !current || !playlist) return false;

    mainMenu
      .addItem((item) =>
        item
          .setTitle(playlist.title)
          .setIcon("list-video")
          .onClick(() => {
            app.workspace.openLinkText(playlist.file.path, "", "tab");
          }),
      )
      .addSeparator();

    addItemsToMenu(mainMenu, playlist.list, (menu, li, submenu) => {
      if (li.type === "subtitle") return null;
      let subTrigger: MenuItem | null = null;
      if (isWithMedia(li)) {
        const renderExtra = li.children.length > 0;
        menu.addItem((item) => {
          item.setTitle(li.title).onClick(() => {
            onPlaylistChange(li, playlist);
          });
          if (compare(current, li.media)) {
            item.setChecked(true);
            const checkParent = (node: PlaylistItem) => {
              if (node.parent < 0) return;
              submenu.get(node.parent)?.setChecked(true);
              const parent = playlist.list[node.parent];
              if (!parent) return;
              checkParent(parent);
            };
            checkParent(li);
          }
          if (!renderExtra) subTrigger = item;
        });
        if (renderExtra)
          // render an extra menu item as submenu trigger
          menu.addItem((item) => {
            item.setTitle("  ↳");
            subTrigger = item;
          });
      } else {
        // render label
        menu.addItem((item) => {
          item.setTitle(li.title).setIcon("hash");
          subTrigger = item;
        });
      }
      return subTrigger;
    });
    return true;
  });

  if (!onPlaylistChange || !current || !playlist) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={onClick}
      aria-label="Select Playlist"
    >
      <PlaylistIcon className="w-7 h-7" />
    </button>
  );
}

export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");
  const onClick = useMenu((menu) => {
    options.forEach(({ label, select, selected }, idx, options) => {
      menu.addItem((item) => {
        if (options.length === 2 && label === "Unknown") {
          label = "On";
        }
        item.setTitle(label).setChecked(selected).onClick(select);
      });
    });
    return true;
  });

  if (tracks.length === 0) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={onClick}
      aria-label="Select Caption"
    >
      <SubtitlesIcon className="w-7 h-7" />
    </button>
  );
}

export function MoreOptions() {
  const player = useMediaPlayer();
  const workspace = useApp((app) => app.workspace);
  const plugin = usePlugin();
  const isEmbed = useIsEmbed();
  const reload = useReload();
  const source = useMediaViewStore((state) => state.source);
  const store = useMediaViewStoreInst();
  const onClick = useMenu((menu) => {
    if (!player || !source) return false;
    const {
      toggleControls,
      controls,
      setTransform,
      transform,
      disableWebFullscreen,
      toggleWebFullscreen,
    } = store.getState();
    workspace.trigger(
      "mx-media-menu",
      menu,
      {
        player,
        reload,
        source: source.url,
        viewType: source.viewType,
        toggleControls,
        controls,
        setTransform,
        transform,
        plugin,
        disableWebFullscreen,
        toggleWebFullscreen,
      },
      isEmbed ? "player-menu-embed" : "player-menu-view",
    );
    return true;
  });

  if (!player || !source) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={onClick}
      aria-label="More options"
    >
      <MoreIcon className="w-7 h-7" />
    </button>
  );
}
