import { parseTF, TimeSpan } from "./temporal-frag";
import { stringify, parse } from "query-string";
import { parseLinktext } from "obsidian";
import Plyr from "plyr";

/** Player with temporal fragments */
export type Player_TF = HTMLMediaEl_TF | Plyr_TF;
export type Player = HTMLMediaElement | Plyr;

interface TemporalFrag {
  readonly timeSpan: TimeSpan | null;
  setTimeSpan(span: TimeSpan | null): void;
}

/** Plyr with temporal fragments */
export type Plyr_TF = TemporalFrag & Plyr;
/** HTMLMediaElement with temporal fragments */
export type HTMLMediaEl_TF = TemporalFrag & HTMLMediaElement;

export function isHTMLMediaEl_TF(el: HTMLMediaElement): el is HTMLMediaEl_TF {
  return (
    Boolean((el as HTMLMediaEl_TF).timeSpan) ||
    (el as HTMLMediaEl_TF).timeSpan === null
  );
}

const defaultPlyrControls = [
  "play-large", // The large play button in the center
  // "restart", // Restart playback
  // "rewind", // Rewind by the seek time (default 10 seconds)
  "play", // Play/pause playback
  // "fast-forward", // Fast forward by the seek time (default 10 seconds)
  "progress", // The progress bar and scrubber for playback and buffering
  "current-time", // The current time of playback
  "duration", // The full duration of the media
  // "mute", // Toggle mute
  "volume", // Volume control
  "captions", // Toggle captions
  "settings", // Settings menu
  "pip", // Picture-in-picture (currently Safari only)
  // "airplay", // Airplay (currently Safari only)
  // "download", // Show a download button with a link to either the current source or a custom URL you specify in your options
  "fullscreen", // Toggle fullscreen
];

const defaultPlyrOption = {
  fullscreen: { enabled: false },
  invertTime: false,
  controls: defaultPlyrControls,
};

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay";

export type setupTool = {
  timeSpan: TimeSpan | null;
  is: (prop: PlayerProperties) => boolean;
  setHashOpt: (player: Player) => void;
  setPlayerTF: (player: Player) => void;
};

export function getSetupTool(hash: string): setupTool {
  const timeSpan = parseTF(hash);
  const hashQuery = parse(hash);
  // null: exist, with no value (#loop)

  const hashOpts = new Map<string, PlayerProperties>([
    ["loop", "loop"],
    ["mute", "muted"],
    ["play", "autoplay"],
  ]);

  return {
    timeSpan,
    is: (prop) => {
      for (const [hash, key] of hashOpts) {
        if (prop === key && hashQuery[hash] === null) return true;
      }
      return false;
    },
    setPlayerTF: (player) => {
      PlayerTFSetup(player, timeSpan);
    },
    setHashOpt: (player) =>
      hashOpts.forEach((key, hash) => {
        if (hashQuery[hash] === null) player[key] = true;
      }),
  };
}

export function PlayerTFSetup(player: Player, timeSpan?: TimeSpan | null) {
  const playerTF = player as Player_TF;

  /**
   * if current is out of range when start playing,
   * move currentTime back to timeSpan.start
   **/
  const onplaying = (e: Event) => {
    if (!playerTF.timeSpan) return;

    const {
      timeSpan: { start, end },
      currentTime,
    } = playerTF;
    if (currentTime > end || currentTime < start) {
      playerTF.currentTime = start;
    }
  };
  /**
   * if currentTime reaches end, pause video
   * or play at start when loop is enabled
   */
  const ontimeupdate = (e: Event) => {
    if (!playerTF.timeSpan) return;

    const {
      timeSpan: { start, end },
      currentTime,
    } = playerTF;
    if (currentTime > end) {
      if (!playerTF.loop) {
        playerTF.pause();
      } else {
        playerTF.currentTime = start;
        // continue to play in loop
        // if temporal fragment (#t=,2 at the end of src) paused the video
        if (playerTF.paused) playerTF.play();
      }
    }
  };

  /** when update, inject event handler to restrict play range */
  playerTF.setTimeSpan = (span: TimeSpan | null) => {
    // @ts-ignore
    playerTF.timeSpan = span;

    if (span) {
      if (playerTF instanceof HTMLMediaElement && !playerTF.onplaying) {
        (playerTF as HTMLMediaElement).onplaying = onplaying;
        (playerTF as HTMLMediaElement).ontimeupdate = ontimeupdate;
      } else {
        (playerTF as Plyr).on("playing", onplaying);
        (playerTF as Plyr).on("timeupdate", ontimeupdate);
      }
      // set currentTime
      playerTF.currentTime = span.start ?? 0;
    } else {
      if (playerTF instanceof HTMLMediaElement) {
        playerTF.onplaying = null;
        playerTF.ontimeupdate = null;
      } else {
        playerTF.off("playing", onplaying);
        playerTF.off("timeupdate", ontimeupdate);
      }
      // reset currentTime
      playerTF.currentTime = 0;
    }
  };
  playerTF.setTimeSpan(timeSpan ?? null);
}

function setRatio(containerEl: HTMLDivElement, player: Plyr) {
  player.once("ready", function () {
    let trys = 0;

    const id = setInterval(() => {
      if (player.ratio) {
        // @ts-ignore
        containerEl.style.aspectRatio = player.ratio.replace(/:/, "/");
        clearInterval(id);
      } else if (trys >= 10) {
        console.error("failed to get player.ratio");
        clearInterval(id);
      } else trys++;
    }, 100);
  });
}

export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLIFrameElement,
  tool: setupTool,
  options?: Plyr.Options,
): Plyr_TF;
export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLMediaElement,
  tool: setupTool,
  options?: Plyr.Options,
  tracks?: HTMLTrackElement[],
): Plyr_TF;
export function setPlyr(
  container: HTMLDivElement,
  inputEl: HTMLIFrameElement | HTMLMediaElement,
  tool: setupTool,
  options?: Plyr.Options,
  tracks?: HTMLTrackElement[],
): Plyr_TF {
  const { is, setHashOpt, setPlayerTF } = tool;

  if (
    !(
      inputEl instanceof HTMLMediaElement && container.hasClass("local-media")
    ) &&
    !(
      inputEl instanceof HTMLIFrameElement &&
      container.hasClass("external-video")
    )
  )
    throw new TypeError("inputEl and container not match");

  let plyrTargetEl: HTMLDivElement | HTMLMediaElement;
  if (inputEl instanceof HTMLMediaElement) {
    if (tracks) tracks.forEach((t) => inputEl.appendChild(t));
    plyrTargetEl = inputEl;
  } else {
    plyrTargetEl = createDiv({ cls: "plyr__video-embed" });
    plyrTargetEl.appendChild(inputEl);
  }

  container.appendChild(plyrTargetEl);

  if (options) options = { ...defaultPlyrOption, ...options };
  else options = defaultPlyrOption;

  options.autoplay = is("autoplay");
  const player = new Plyr(plyrTargetEl, options);

  // hide poster to make subtitle selectable
  if (tracks)
    container.querySelector("div.plyr__poster")?.addClass("visuallyhidden");

  setRatio(container, player);
  setHashOpt(player);
  setPlayerTF(player);
  if (tracks) player.once("ready", () => player.toggleCaptions());

  return player as Plyr_TF;
}
