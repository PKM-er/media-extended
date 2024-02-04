import "./menu.css";

import {
  useCaptionOptions,
  useMediaPlayer,
  useMediaState,
} from "@vidstack/react";
import { Menu } from "obsidian";
import { MoreIcon, SubtitlesIcon } from "@/components/icon";
import {
  useApp,
  useIsEmbed,
  useMediaViewStore,
  useMediaViewStoreInst,
} from "../context";
import { dataLpPassthrough } from "./buttons";

export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");

  if (tracks.length === 0) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={(evt) => {
        const menu = new Menu();
        // menu.addItem((item) =>
        //   item.setIsLabel(true).setTitle("Caption " + hint),
        // );
        options.forEach(({ label, select, selected }, idx, options) => {
          menu.addItem((item) => {
            if (options.length === 2 && label === "Unknown") {
              label = "On";
            }
            item.setTitle(label).setChecked(selected).onClick(select);
          });
        });
        menu.showAtMouseEvent(evt.nativeEvent);
        evt.nativeEvent.stopImmediatePropagation();
      }}
      aria-label="Select Caption"
    >
      <SubtitlesIcon className="w-7 h-7" />
    </button>
  );
}

export function MoreOptions() {
  const player = useMediaPlayer();
  const workspace = useApp((app) => app.workspace);
  const isEmbed = useIsEmbed();
  const source = useMediaViewStore((state) => state.source);
  const store = useMediaViewStoreInst();

  if (!player || !source) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={(evt) => {
        const menu = new Menu();
        const { toggleControls, controls, hash, setTransform, transform } =
          store.getState();
        workspace.trigger(
          "mx-media-menu",
          menu,
          {
            player,
            source,
            toggleControls,
            controls,
            hash,
            setTransform,
            transform,
          },
          isEmbed ? "player-menu-embed" : "player-menu-view",
        );
        menu.showAtMouseEvent(evt.nativeEvent);
        evt.nativeEvent.stopImmediatePropagation();
      }}
      aria-label="More options"
    >
      <MoreIcon className="w-7 h-7" />
    </button>
  );
}
