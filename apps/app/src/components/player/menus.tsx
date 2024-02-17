import "./menu.css";

import {
  useCaptionOptions,
  useMediaPlayer,
  useMediaState,
} from "@vidstack/react";
import { around } from "monkey-around";
import { Menu } from "obsidian";
import { useRef } from "react";
import { MoreIcon, SubtitlesIcon } from "@/components/icon";
import { showAtButton } from "@/lib/menu";
import {
  useApp,
  useIsEmbed,
  useMediaViewStore,
  useMediaViewStoreInst,
  usePlugin,
  useReload,
} from "../context";
import { dataLpPassthrough } from "./buttons";

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
  const source = useMediaViewStore((state) => state.source?.url);
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
        source,
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
