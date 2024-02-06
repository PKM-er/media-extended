import type { MediaPlayerInstance } from "@vidstack/react";
import { Notice, debounce } from "obsidian";
import { PlaybackSpeedPrompt } from "@/media-view/menu/prompt";
import { speedOptions } from "@/media-view/menu/speed";
import type MxPlugin from "@/mx-main";
import { addMediaViewCommand } from "./utils";

const mediaCommands: Controls[] = [
  {
    id: "toggle-play",
    label: "Play/pause",
    icon: "play",
    action: (media) => {
      media.paused = !media.paused;
    },
  },
  ...[5, 30].flatMap((sec): Controls[] => [
    {
      id: `forward-${sec}s`,
      label: `Forward ${sec}s`,
      icon: "forward",
      action: (media) => {
        media.currentTime += sec;
      },
      repeat: true,
    },
    {
      id: `rewind-${sec}s`,
      label: `Rewind ${sec}s`,
      icon: "rewind",
      action: (media) => {
        media.currentTime -= sec;
      },
      repeat: true,
    },
  ]),
  {
    id: "toggle-mute",
    label: "Mute/unmute",
    icon: "volume-x",
    action: (media) => {
      media.muted = !media.muted;
    },
  },
  {
    id: "toggle-fullscreen",
    label: "Enter/exit fullscreen",
    icon: "expand",
    check: (media) => media.state.canFullscreen,
    action: (media) => {
      if (media.state.fullscreen) {
        media.exitFullscreen();
      } else {
        media.enterFullscreen();
      }
    },
  },
  ...speed(),
];
function speed(): Controls[] {
  // reuse notice if user is spamming speed change
  let notice: Notice | null = null;
  const hide = debounce(() => notice?.hide(), 2000, true);
  function notify(message: string) {
    if (!notice || notice.noticeEl.isConnected === false) {
      notice = new Notice(message, 0);
    } else {
      notice.setMessage(message);
    }
    hide();
  }
  function notifyAllowDup(message: string) {
    new Notice(message, 2000);
  }
  return [
    {
      id: "reset-speed",
      label: "Reset playback speed",
      icon: "reset",
      check: (media) => media.state.playbackRate !== 1,
      action: (media) => {
        media.playbackRate = 1;
        notifyAllowDup("Speed reset to 1x");
      },
    },
    {
      id: "increase-speed",
      label: "Increase playback speed",
      icon: "arrow-up",
      action: (media) => {
        const curr = media.playbackRate;
        if (curr >= speedOptions.last()!) {
          notifyAllowDup("Cannot increase speed further");
          return;
        }
        // find nearest speed option greater than current speed
        const next = speedOptions.find((speed) => speed > curr)!;
        media.playbackRate = next;
        notify(`Speed increased to ${next}x`);
      },
    },
    {
      id: "decrease-speed",
      label: "Decrease playback speed",
      icon: "arrow-down",
      action: (media) => {
        const curr = media.playbackRate;
        if (curr <= speedOptions.first()!) {
          notifyAllowDup("Cannot decrease speed further");
          return;
        }
        // find nearest speed option less than current speed
        const prev = speedOptions
          .slice()
          .reverse()
          .find((speed) => speed < curr)!;
        media.playbackRate = prev;
        notify(`Speed decreased to ${prev}x`);
      },
    },
    {
      id: "set-speed",
      label: "Set playback speed",
      icon: "gauge",
      action: async (media) => {
        const newSpeed = await PlaybackSpeedPrompt.run();
        if (!newSpeed) return;
        media.playbackRate = newSpeed;
        notify(`Speed set to ${newSpeed}x`);
      },
    },
  ];
}
interface Controls {
  id: string;
  label: string;
  icon: string;
  repeat?: boolean;
  check?: (media: MediaPlayerInstance) => boolean;
  action: (media: MediaPlayerInstance) => void;
}

export function registerControlCommands(plugin: MxPlugin) {
  mediaCommands.forEach(({ id, label, icon, action, repeat, check }) => {
    addMediaViewCommand(
      {
        id,
        name: label,
        icon,
        repeatable: repeat,
        playerCheckCallback: (checking, view) => {
          if (!view) return false;
          const player = view.store.getState().player;
          if (!player) return false;
          if (check && !check(player)) return false;
          if (checking) return true;
          action(player);
        },
        noteCheckCallback(checking, view) {
          if (!view) return false;
          const player = view.store.getState().player;
          if (!player) return false;
          if (check && !check(player)) return false;
          if (checking) return true;
          action(player);
        },
      },
      plugin,
    );
  });
}
