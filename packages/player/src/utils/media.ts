import { BaseMedia, Media, SeekToOptions } from "mx-base";

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

  _pause() {
    return this.instance.pause();
  }
  _play() {
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
    const state = this.instance.getPlayerState();
    return (
      state === YT.PlayerState.PAUSED ||
      state === YT.PlayerState.CUED ||
      state === YT.PlayerState.UNSTARTED
    );
  }
  _pause() {
    this.instance.pauseVideo();
  }
  _play() {
    this.instance.playVideo();
  }
}
