import "./menu.css";

import type { MediaPlayerInstance } from "@vidstack/react";
import {
  useCaptionOptions,
  useMediaPlayer,
  useMediaState,
} from "@vidstack/react";
import type { MenuItem } from "obsidian";
import { Menu } from "obsidian";
import { MoreIcon, SubtitlesIcon } from "@/components/icon";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { PlaybackSpeedPrompt } from "./prompt";

export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");

  if (tracks.length === 0) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={(evt) => {
        const menu = new Menu();
        // menu.addItem((item) =>
        //   item.setIsLabel(true).setTitle("Caption " + hint),
        // );
        options.forEach(({ label, select, selected }) => {
          menu.addItem((item) =>
            item.setTitle(label).setChecked(selected).onClick(select),
          );
        });
        menu.showAtMouseEvent(evt.nativeEvent);
      }}
      aria-label="Select Caption"
    >
      <SubtitlesIcon className="w-7 h-7" />
    </button>
  );
}

declare module "obsidian" {
  interface MenuItem {
    setSubmenu(): Menu;
  }
}

const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export function MoreOptions() {
  const player = useMediaPlayer();
  if (!player) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={(evt) => {
        const menu = new Menu();
        const isVideo = player.state.viewType === "video";
        const isWebview = player.provider instanceof WebiviewMediaProvider;
        // webview not support pip yet
        if (isVideo && !isWebview) {
          if (!player.state.pictureInPicture) {
            menu.addItem((item) =>
              item
                .setTitle("Picture in Picture")
                .setIcon("picture-in-picture")
                .onClick(() => player.enterPictureInPicture()),
            );
          } else {
            menu.addItem((item) =>
              item
                .setTitle("Exit Picture in Picture")
                .setIcon("picture-in-picture-2")
                .onClick(() => player.exitPictureInPicture()),
            );
          }
        }
        menu.addItem((item) => speedMenu(item, player));
        menu.showAtMouseEvent(evt.nativeEvent);
      }}
      aria-label="More options"
    >
      <MoreIcon className="w-7 h-7" />
    </button>
  );
}

function speedLabel(speed: number) {
  const speedLabel = new DocumentFragment();
  speedLabel.appendText("Speed ");
  speedLabel.createEl("code", { text: `(${speed}x)` });
  return speedLabel;
}

function customSpeedLabel(speed: number) {
  const customSpeedLabel = new DocumentFragment();
  customSpeedLabel.appendText("Custom");
  if (speedOptions.includes(speed)) {
    customSpeedLabel.appendText(" ");
    customSpeedLabel.createEl("code", { text: `(${speed}x)` });
  } else {
    customSpeedLabel.appendText("...");
  }
  return customSpeedLabel;
}

function speedMenu(item: MenuItem, player: MediaPlayerInstance) {
  const currentSpeed = player.state.playbackRate;

  const isCustomSpeed = !speedOptions.includes(currentSpeed);

  const sub = item
    .setTitle(speedLabel(currentSpeed))
    .setIcon("gauge")
    .setSubmenu();
  speedOptions.forEach((speed) =>
    sub.addItem((item) =>
      item
        .setTitle(`${speed}x`)
        .setChecked(speed === currentSpeed)
        .onClick(() => {
          player.playbackRate = speed;
        }),
    ),
  );
  sub.addItem((item) =>
    item
      .setTitle(customSpeedLabel(currentSpeed))
      .setChecked(isCustomSpeed)
      .onClick(async () => {
        const newSpeed = await PlaybackSpeedPrompt.run();
        if (!newSpeed) return;
        player.playbackRate = newSpeed;
      }),
  );
}
