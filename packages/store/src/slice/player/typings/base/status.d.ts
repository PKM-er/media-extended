export interface BasicPlayerStatus {
  /** -1 if not explicitly specified */
  fragment: Fragment | null;
  paused: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  autoplay: boolean;
  loop: boolean;
  /**
   * the currentTime of the provider
   * one-way binded to the currentTime of the provider
   * (provider -> store, updated via onTimeUpdate)
   * setting this value won't applied to provider
   */
  currentTime: number;
  duration: number | null;
  /**
   * indicate that provider is trying to set new currentTime
   * set to false when the new currentTime is applied
   * (loaded and can continue to play, aka seeked)
   */
  seeking: boolean;
  /**
   * buffered range in seconds
   */
  buffered: number;
  waiting: boolean;
  ended: boolean;
  hasStarted: boolean;
  error: string | null;
}
