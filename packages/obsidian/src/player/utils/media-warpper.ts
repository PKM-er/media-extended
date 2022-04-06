type SeekToOptions = Partial<{
  allowSeekAhead: boolean;
}>;
export interface ProviderTypeMap {
  html5: HTMLMediaElement;
  youtube: YT.Player;
  vimeo: never;
}
type ProviderType = keyof ProviderTypeMap;

type Provider<T extends ProviderType> = {
  from: T;
  instance: ProviderTypeMap[T];
};

export interface Media<T extends ProviderType = ProviderType> {
  readonly provider: Provider<T>;

  readonly instance: ProviderTypeMap[T];

  readonly currentTime: number;
  seekTo(time: number, options?: SeekToOptions): void;

  readonly duration: number;

  muted: boolean;

  playbackRate: number;

  volume: number;

  readonly paused: boolean;
  pause(): void;
  play(): Promise<void> | void;
}
class BaseMedia<T extends ProviderType = ProviderType> {
  constructor(public readonly provider: Provider<T>) {
    if (provider.from === "vimeo") throw new Error("not implemented");
  }
  get instance(): ProviderTypeMap[T] {
    return this.provider.instance;
  }
}

export class HTMLMedia extends BaseMedia<"html5"> implements Media<"html5"> {
  constructor(el: HTMLMediaElement) {
    super({ from: "html5", instance: el });
  }
  get currentTime() {
    return this.instance.currentTime;
  }
  seekTo(time: number): void {
    this.instance.currentTime = time;
  }

  get duration() {
    return this.instance.duration;
  }

  get muted() {
    return this.instance.muted;
  }
  set muted(muted) {
    this.instance.muted = muted;
  }

  get playbackRate() {
    return this.instance.playbackRate;
  }
  set playbackRate(speed) {
    this.instance.playbackRate = speed;
  }

  get volume() {
    return this.instance.volume;
  }
  set volume(volume) {
    this.instance.volume = volume;
  }

  get paused(): boolean {
    return this.instance.paused;
  }

  pause() {
    return this.instance.pause();
  }
  play() {
    return this.instance.play();
  }
}
export class YoutubeMedia
  extends BaseMedia<"youtube">
  implements Media<"youtube">
{
  constructor(player: YT.Player) {
    super({ from: "youtube", instance: player });
  }

  get currentTime() {
    return this.instance.getCurrentTime();
  }
  seekTo(time: number, options?: SeekToOptions): void {
    this.instance.seekTo(time, options?.allowSeekAhead ?? true);
  }

  get duration() {
    return this.instance.getDuration();
  }

  get muted() {
    return this.instance.isMuted();
  }
  set muted(muted) {
    this.instance[muted ? "mute" : "unMute"]();
  }

  get playbackRate() {
    return this.instance.getPlaybackRate();
  }
  set playbackRate(rate) {
    this.instance.setPlaybackRate(rate);
  }

  get volume() {
    return this.instance.getVolume() / 100;
  }
  set volume(volume) {
    this.instance.setVolume(volume * 100);
  }

  get paused() {
    return this.instance.getPlayerState() === YT.PlayerState.PAUSED;
  }
  pause() {
    this.instance.pauseVideo();
  }
  play() {
    this.instance.playVideo();
  }
}
