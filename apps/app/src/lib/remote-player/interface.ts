/* eslint-disable @typescript-eslint/naming-convention */
import type {
  MediaErrorCode,
  TextTrackInit,
  VTTContent,
} from "@vidstack/react";
import type { BilibiliPlayerManifest } from "@/web/bili-api/base";
import type { MessageController, Nil } from "../message";
// import { enumerate } from "../must-include";
import type { ScreenshotInfo } from "../screenshot";
import type { SerilizableTimeRanges } from "./lib/time-range";
import {
  toSerilizableTimeRange,
  DummyTimeRanges,
  isSerilizableTimeRange,
} from "./lib/time-range";

// export const mediaEvents = enumerate<MediaEvent>()(
//   "loadstart",
//   "abort",
//   "emptied",
//   "error",
//   "volumechange",
//   "loadeddata",
//   "loadedmetadata",
//   "canplay",
//   "canplaythrough",
//   "durationchange",
//   "play",
//   "progress",
//   "stalled",
//   "suspend",
//   "pause",
//   "playing",
//   "ratechange",
//   "seeked",
//   "seeking",
//   "ended",
//   "waiting",
//   "timeupdate",
// );

export const mediaWritableStateProps = [
  "currentTime",
  "playbackRate",
  "volume",
  "muted",
] as const;
export const mediaReadonlyStateProps = [
  "paused",
  "played",
  "networkState",
  "duration",
  "buffered",
  "seekable",
  "readyState",
  "ended",
  "autoplay",
  "error",
] as const;
export const mediaActionProps = ["play", "pause"] as const;

/**
 * emitted when the player is mounted
 */
export const mountedEvent = "mx-mounted";
/**
 * emitted when the player is ready to receive messages
 */
export const readyEvent = "mx-ready";
/**
 * emitted when the player is ready to play media
 */
export const playReadyEvent = "mx-play-ready";

export type CustomEvent =
  | typeof mountedEvent
  | typeof readyEvent
  | typeof playReadyEvent;

export type MediaEvent = keyof MediaEventPayloadMap;

export type MediaEventMap = {
  [K in MediaEvent]: {
    type: K;
    payload: MediaEventPayloadMap[K];
  };
};

export type MediaEventPayloadMap = {
  loadstart: {
    networkState: number;
  };
  enterpictureinpicture: void;
  leavepictureinpicture: void;
  abort: void;
  emptied: void;
  error: {
    message: string;
    code: MediaErrorCode;
  };
  volumechange: {
    volume: number;
    muted: boolean;
  };
  loadeddata: void;
  loadedmetadata: void;
  canplay: {
    duration: number;
    buffered: SerilizableTimeRanges;
    seekable: SerilizableTimeRanges;
  };
  canplaythrough: {
    duration: number;
    buffered: SerilizableTimeRanges;
    seekable: SerilizableTimeRanges;
  };
  durationchange: {
    played: SerilizableTimeRanges;
    duration: number;
  };
  play: void;
  progress: {
    buffered: SerilizableTimeRanges;
    seekable: SerilizableTimeRanges;
  };
  stalled: {
    readyState: number;
  };
  suspend: void;
  playing: void;
  ratechange: {
    rate: number;
  };
  seeked: {
    current: number;
    played: SerilizableTimeRanges;
    duration: number;
    ended: boolean;
  };
  seeking: {
    current: number;
  };
  ended: {
    current: number;
    played: SerilizableTimeRanges;
    duration: number;
    ended: boolean;
    controls: boolean;
  };
  waiting: {
    readyState: number;
  };
  timeupdate: {
    current: number;
    played: SerilizableTimeRanges;
  };
  pause: {
    readyState: number;
  };
};

interface RemoteFetchResponse {
  ab: ArrayBuffer;
  type: string;
  gzip: boolean;
  respHeaders: Record<string, string>;
}

export type MsgCtrlRemote = MessageController<
  {
    [K in MediaActionProps]: (...args: Parameters<HTMLMediaElement[K]>) => {
      value: Awaited<ReturnType<HTMLMediaElement[K]>>;
    };
  } & {
    [K in MediaWritableStateProps as `set${Capitalize<K>}`]: (
      val: HTMLMediaElement[K],
    ) => void;
  } & {
    [K in MediaStateProps as `get${Capitalize<K>}`]: () => {
      value: HTMLMediaElement[K];
    };
  } & {
    pictureInPictureEnabled: () => { value: boolean };
  } & {
    loadPlugin(code?: string): void;
    screenshot(
      type?: string,
      quality?: number,
    ): {
      value: ScreenshotInfo;
      transfer: Transferable[];
    };
    requestPictureInPicture(): void;
    exitPictureInPicture(): void;
    fetch(
      url: string,
      init?: RequestInit & { gzip?: boolean },
    ): {
      value: RemoteFetchResponse;
      transfer: Transferable[];
    };
    bili_getManifest(): {
      value: BilibiliPlayerManifest;
    };
    getTrack(id: string): { value: VTTContent | null };
  },
  Nil,
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "mx-toggle-controls": boolean;
    "mx-toggle-webfs": boolean;
  },
  Record<CustomEvent, void> & MediaEventPayloadMap & CustomEventWithPayload
>;

type CustomEventWithPayload = {
  "mx-open-browser": { url: string; message?: string };
  "mx-text-tracks": { tracks: (TextTrackInit & { id: string })[] };
};

export type MsgCtrlLocal = MessageController<
  Nil,
  {
    [K in MediaActionProps]: (
      ...args: Parameters<HTMLMediaElement[K]>
    ) => ReturnType<HTMLMediaElement[K]>;
  } & {
    [K in MediaWritableStateProps as `set${Capitalize<K>}`]: (
      val: HTMLMediaElement[K],
    ) => void;
  } & {
    [K in MediaStateProps as `get${Capitalize<K>}`]: () => HTMLMediaElement[K];
  } & {
    pictureInPictureEnabled: () => boolean;
  } & {
    loadPlugin(code?: string): void;
    screenshot(type?: string, quality?: number): ScreenshotInfo;
    fetch(
      url: string,
      init?: RequestInit & { gzip?: boolean },
    ): Promise<RemoteFetchResponse>;
    requestPictureInPicture(): void;
    exitPictureInPicture(): void;
    bili_getManifest(): Promise<BilibiliPlayerManifest>;
    getTrack(id: string): Promise<VTTContent | null>;
  },
  Record<CustomEvent, void> & MediaEventPayloadMap & CustomEventWithPayload,
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "mx-toggle-controls": boolean;
    "mx-toggle-webfs": boolean;
  }
>;

export type MediaStateProps =
  | (typeof mediaReadonlyStateProps)[number]
  | (typeof mediaWritableStateProps)[number];

export type MediaWritableStateProps = (typeof mediaWritableStateProps)[number];
export type MediaSetStateValueMap = {
  [K in MediaWritableStateProps]: HTMLMediaElement[K];
};
export function capitalize<T extends string>(str: T) {
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<T>;
}

export type MediaActionProps = (typeof mediaActionProps)[number];

export function serializeMediaStatePropValue(value: any) {
  if (value instanceof TimeRanges) {
    return toSerilizableTimeRange(value);
  }
  return value;
}

export function deserializeMediaStatePropValue(v: unknown) {
  if (isSerilizableTimeRange(v)) {
    return new DummyTimeRanges(v.value);
  }
  return v;
}
