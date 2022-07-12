import { MutableRefObject } from "react";

export type PlayerRef = MutableRefObject<YT.Player | null>;

export type YoutubePlayerProps = YoutubePlayerEvents & {
  videoId: string;
} & YoutubePlayerStateProps;

export type YoutubePlayerEvents = YT.Events & {
  onTimeUpdate?: YT.PlayerEventHandler<YT.PlayerEvent>;
  onProgress?: YT.PlayerEventHandler<YT.PlayerEvent>;
};

export type EventHandlers = Required<YoutubePlayerEvents>;

export const BasicOptions = {
  width: 0,
  height: 0,
  playerVars: {
    origin: window.location.href,
    // Disable keyboard as we handle it
    disablekb: +true,
    modestbranding: +true,
    hl: "en",
  },
};

interface YoutubePlayerStateProps {
  mute: boolean;
  autoplay: boolean;
  loop: boolean;
  controls: boolean;
  language: string;
  seeking: boolean;
  timeupdateFreq?: number;
  progressFreq?: number;
}

/**
 * get properties that require youtube player to be reset to apply
 */
export const getResetProps = ({
  autoplay,
  controls,
}: YoutubePlayerStateProps) => [autoplay, controls] as const;

export const propsToPlayerVars = ({
  autoplay,
  controls,
  loop,
  mute,
  language,
}: YoutubePlayerStateProps): Partial<YT.PlayerVars> => ({
  hl: language,
  mute: +mute,
  autoplay: +autoplay,
  loop: +loop,
  controls: +controls,
});
