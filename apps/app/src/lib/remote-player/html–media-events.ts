/* eslint-disable @typescript-eslint/naming-convention */
import type { MediaCanPlayDetail, MediaSetupContext } from "@vidstack/react";
import { Maverick } from "@vidstack/react";
const { onDispose, peek } = Maverick;
import { useDisposalBin } from "maverick.js/std";

// import { RAFLoop } from "../../foundation/observers/raf-loop";
// import { getNumberOfDecimalPlaces } from "../../utils/number";
import type { EventPayload } from "../message";
import type { WebiviewMediaProvider } from "./provider";
import { deserializeMediaStatePropValue, type MediaEventMap } from "./type";

declare global {
  // eslint-disable-next-line no-var
  var __DEV__: boolean | undefined;
}

interface Event {
  type: string;
  payload: any;
}

export class HTMLMediaEvents {
  private _disposal = useDisposalBin();
  private _waiting = false;
  private _attachedLoadStart = false;
  private _attachedCanPlay = false;
  // private _timeRAF = new RAFLoop(this._onAnimationFrame.bind(this));

  private get _webview() {
    return this._provider.webview;
  }
  private get _media() {
    return this._provider.media;
  }

  private get _notify() {
    return this._ctx.delegate._notify;
  }

  constructor(
    private _provider: WebiviewMediaProvider,
    private _ctx: MediaSetupContext,
  ) {
    this._attachInitialListeners();
    // handle RAF in remote
    // effect(this._attachTimeUpdate.bind(this));
    onDispose(this._media.on("timeupdate", this._onTimeUpdate.bind(this)));
    onDispose(this._onDispose.bind(this));
  }

  private _onDispose() {
    this._attachedLoadStart = false;
    this._attachedCanPlay = false;
    // this._timeRAF._stop();
    this._disposal.empty();
  }

  /**
   * The `timeupdate` event fires surprisingly infrequently during playback, meaning your progress
   * bar (or whatever else is synced to the currentTime) moves in a choppy fashion. This helps
   * resolve that by retrieving time updates in a request animation frame loop.
   */
  // private async _onAnimationFrame() {
  //   const newTime = await this._media.methods.getCurrentTime();
  //   if (this._ctx.$state.currentTime() !== newTime) {
  //     this._updateCurrentTime(newTime, await this._media.methods.getPlayed());
  //   }
  // }

  private _attachInitialListeners() {
    if (__DEV__) {
      this._ctx.logger?.info("attaching initial listeners");
    }

    this._attachEventListener("loadstart", this._onLoadStart);
    this._attachEventListener("abort", this._onAbort);
    this._attachEventListener("emptied", this._onEmptied);
    this._attachEventListener("error", this._onError);
    this._attachEventListener("volumechange", this._onVolumeChange);
    if (__DEV__)
      this._ctx.logger?.debug("attached initial media event listeners");
  }

  private _attachLoadStartListeners() {
    if (this._attachedLoadStart) return;

    if (__DEV__) {
      this._ctx.logger?.info("attaching load start listeners");
    }

    this._disposal.add(
      this._attachEventListener("loadeddata", this._onLoadedData),
      this._attachEventListener("loadedmetadata", this._onLoadedMetadata),
      this._attachEventListener("canplay", this._onCanPlay),
      this._attachEventListener("canplaythrough", this._onCanPlayThrough),
      this._attachEventListener("durationchange", this._onDurationChange),
      this._attachEventListener("play", this._onPlay),
      this._attachEventListener("progress", this._onProgress),
      this._attachEventListener("stalled", this._onStalled),
      this._attachEventListener("suspend", this._onSuspend),
    );

    this._attachedLoadStart = true;
  }

  private _attachCanPlayListeners() {
    if (this._attachedCanPlay) return;

    if (__DEV__) {
      this._ctx.logger?.info("attaching can play listeners");
    }

    this._disposal.add(
      this._attachEventListener("pause", this._onPause),
      this._attachEventListener("playing", this._onPlaying),
      this._attachEventListener("ratechange", this._onRateChange),
      this._attachEventListener("seeked", this._onSeeked),
      this._attachEventListener("seeking", this._onSeeking),
      this._attachEventListener("ended", this._onEnded),
      this._attachEventListener("waiting", this._onWaiting),
    );
    this._attachedCanPlay = true;
  }

  private _handlers = __DEV__
    ? new Map<string, (event: any) => void>()
    : undefined;
  private _handleDevEvent = __DEV__ ? this._onDevEvent.bind(this) : undefined;
  private _attachEventListener<K extends keyof MediaEventMap>(
    eventType: K,
    handler: (payload: MediaEventMap[K]) => void,
  ) {
    if (__DEV__) this._handlers!.set(eventType, handler);

    const _handler = __DEV__ ? this._handleDevEvent! : handler.bind(this);
    const unload = this._media.on(eventType, _handler as any);
    return onDispose(unload);
  }

  private _onDevEvent(event: EventPayload) {
    if (!__DEV__) return;

    this._ctx.logger
      ?.debugGroup(`📺 provider fired \`${event.type}\``)
      .labelledLog("Provider", this._provider)
      .labelledLog("Event", event)
      .labelledLog("Media Store", { ...this._ctx.$state })
      .dispatch();

    this._handlers!.get(event.type)?.call(this, event);
  }

  private _updateCurrentTime(
    time: number,
    played: TimeRanges,
    trigger?: Event,
  ) {
    const detail = {
      // Avoid errors where `currentTime` can have higher precision.
      currentTime: Math.min(time, this._ctx.$state.seekableEnd()),
      played,
    };

    this._notify("time-update", detail, trigger && new Event(trigger.type));
  }

  private _onLoadStart(event: MediaEventMap["loadstart"]) {
    if (event.payload.networkState === 3) {
      this._onAbort(event);
      return;
    }

    this._attachLoadStartListeners();
    this._notify("load-start", undefined, new Event(event.type));
  }

  private _onAbort(event: { type: string; payload: any }) {
    this._notify("abort", undefined, new Event(event.type));
  }

  private _onEmptied({ type }: MediaEventMap["emptied"]) {
    this._notify("emptied", undefined, new Event(type));
  }

  private _onLoadedData(event: Event) {
    this._notify("loaded-data", undefined, new Event(event.type));
  }

  private _onLoadedMetadata(event: Event) {
    this._attachCanPlayListeners();

    this._notify("loaded-metadata", undefined, new Event(event.type));
  }

  private _getCanPlayDetail({
    duration,
    buffered,
    seekable,
  }: {
    duration: number;
    buffered: TimeRanges;
    seekable: TimeRanges;
  }): MediaCanPlayDetail {
    return {
      provider: peek(this._ctx.$provider)!,
      duration,
      buffered,
      seekable,
    };
  }

  private _onPlay(event: Event) {
    if (!this._ctx.$state.canPlay) return;
    this._notify("play", undefined, new Event(event.type));
  }

  private _onPause({ type, payload }: MediaEventMap["pause"]) {
    // Avoid seeking events triggering pause.
    if (payload.readyState === 1 && !this._waiting) return;
    this._waiting = false;
    // this._timeRAF._stop();
    this._notify("pause", undefined, new Event(type));
  }

  private _onCanPlay({ type, payload }: MediaEventMap["canplay"]) {
    const buffered = deserializeMediaStatePropValue(
      payload.buffered,
    ) as TimeRanges;
    const seekable = deserializeMediaStatePropValue(
      payload.seekable,
    ) as TimeRanges;
    this._ctx.delegate._ready(
      this._getCanPlayDetail({
        duration: payload.duration,
        buffered,
        seekable,
      }),
      new Event(type),
    );
  }

  private _onCanPlayThrough({
    type,
    payload,
  }: MediaEventMap["canplaythrough"]) {
    if (this._ctx.$state.started()) return;
    const buffered = deserializeMediaStatePropValue(
      payload.buffered,
    ) as TimeRanges;
    const seekable = deserializeMediaStatePropValue(
      payload.seekable,
    ) as TimeRanges;
    this._notify(
      "can-play-through",
      this._getCanPlayDetail({
        duration: payload.duration,
        buffered,
        seekable,
      }),
      new Event(type),
    );
  }

  private _onPlaying({ type }: MediaEventMap["playing"]) {
    this._waiting = false;
    this._notify("playing", undefined, new Event(type));
    // this._timeRAF._start();
  }

  private _onStalled({ type, payload }: MediaEventMap["stalled"]) {
    this._notify("stalled", undefined, new Event(type));
    if (payload.readyState < 3) {
      this._waiting = true;
      this._notify("waiting", undefined, new Event(type));
    }
  }

  private _onWaiting({ type, payload }: MediaEventMap["waiting"]) {
    if (payload.readyState < 3) {
      this._waiting = true;
      this._notify("waiting", undefined, new Event(type));
    }
  }

  private _onEnded(event: MediaEventMap["ended"]) {
    const { payload } = event;
    const played = deserializeMediaStatePropValue(payload.played) as TimeRanges;

    // this._timeRAF._stop();
    this._updateCurrentTime(payload.duration, played, event);
    this._notify("end", undefined, new Event(event.type));
  }

  // protected _attachTimeUpdate() {
  //   if (this._ctx.$state.paused()) {
  //     onDispose(this._media.on("timeupdate", this._onTimeUpdate.bind(this)));
  //   }
  // }

  protected _onTimeUpdate(event: MediaEventMap["timeupdate"]) {
    const { payload } = event;
    const played = deserializeMediaStatePropValue(payload.played) as TimeRanges;
    this._updateCurrentTime(payload.current, played, event);
  }

  private _onDurationChange(event: MediaEventMap["durationchange"]) {
    const { payload } = event;
    const played = deserializeMediaStatePropValue(payload.played) as TimeRanges;

    if (this._ctx.$state.ended()) {
      this._updateCurrentTime(payload.duration, played, event);
    }

    this._notify("duration-change", payload.duration, new Event(event.type));
  }

  private _onVolumeChange({ type, payload }: MediaEventMap["volumechange"]) {
    const detail = {
      volume: payload.volume,
      muted: payload.muted,
    };

    this._notify("volume-change", detail, new Event(type));
  }

  private _onSeeked(event: MediaEventMap["seeked"]) {
    const { payload } = event;
    const played = deserializeMediaStatePropValue(payload.played) as TimeRanges;

    this._updateCurrentTime(payload.current, played, event);

    this._notify("seeked", payload.current, new Event(event.type));

    // HLS: If precision has increased by seeking to the end, we'll call `play()` to properly end.
    // if (
    //   Math.trunc(payload.current) === Math.trunc(payload.duration) &&
    //   getNumberOfDecimalPlaces(payload.duration) >
    //     getNumberOfDecimalPlaces(payload.current)
    // ) {
    //   this._updateCurrentTime(payload.duration, played, event);

    //   if (!payload.ended) {
    //     this._ctx.player.dispatch(
    //       new DOMEvent<void>("media-play-request", {
    //         trigger: new Event(event.type),
    //       }),
    //     );
    //   }
    // }
  }

  private _onSeeking({ type, payload }: MediaEventMap["seeking"]) {
    this._notify("seeking", payload.current, new Event(type));
  }

  private _onProgress({ type, payload }: MediaEventMap["progress"]) {
    const detail = {
      buffered: deserializeMediaStatePropValue(payload.buffered) as TimeRanges,
      seekable: deserializeMediaStatePropValue(payload.seekable) as TimeRanges,
    };

    this._notify("progress", detail, new Event(type));
  }

  private _onSuspend({ type }: MediaEventMap["suspend"]) {
    this._notify("suspend", undefined, new Event(type));
  }

  private _onRateChange({ type, payload }: MediaEventMap["ratechange"]) {
    this._notify("rate-change", payload.rate, new Event(type));
  }

  private _onError({ type, payload }: MediaEventMap["error"]) {
    const detail = {
      message: payload.message,
      code: payload.code,
    };

    this._notify("error", detail, new ErrorEvent(type, { error: payload }));
  }
}
