import { PlyrControls } from "./plyr-controls";

export interface MxSettings {
  mediaFragmentsEmbed: boolean;
  timestampLink: boolean;
  extendedImageEmbedSyntax: boolean;
  thumbnailPlaceholder: boolean;
  useYoutubeControls: boolean;
  interalBiliPlayback: boolean;
  hideYtbRecomm: boolean;
  embedMaxHeight: string;
  embedMaxHeightMobile: string;
  embedMinWidth: string;
  embedMinWidthMobile: string;
  plyrControls: Record<PlyrControls, boolean>;
  plyrControlsMobile: Record<PlyrControls, boolean>;
  timestampTemplate: string;
  timestampOffset: number;
  hideEmbedControls: boolean;
}

export const DEFAULT_SETTINGS: MxSettings = {
  mediaFragmentsEmbed: true,
  timestampLink: true,
  extendedImageEmbedSyntax: true,
  thumbnailPlaceholder: false,
  useYoutubeControls: false,
  interalBiliPlayback: true,
  hideYtbRecomm: false,
  embedMaxHeight: "30vh",
  embedMinWidth: "400px",
  plyrControls: {
    restart: false,
    rewind: false,
    play: true,
    "fast-forward": false,
    progress: true,
    "current-time": true,
    duration: true,
    mute: false,
    volume: true,
    captions: true,
    settings: true,
    pip: false,
    fullscreen: true, // Toggle fullscreen
  },
  embedMaxHeightMobile: "20vh",
  embedMinWidthMobile: "200px",
  plyrControlsMobile: {
    restart: false,
    rewind: false,
    play: true,
    "fast-forward": false,
    progress: true,
    "current-time": false,
    duration: false,
    mute: false,
    volume: true,
    captions: true,
    settings: true,
    pip: false,
    fullscreen: true, // Toggle fullscreen
  },
  timestampTemplate: "\n{{TIMESTAMP}}\n",
  timestampOffset: 0,
  hideEmbedControls: false,
};