import { ActionState } from "../../slice/action";
import { InterfaceState } from "../../slice/interface";
import { UserSeek } from "../../slice/user-seek";
import { BilibiliMeta, BilibiliSource } from "../bilibili";
import { HTMLMediaMeta, HTMLMediaSource, ObsidianMeta } from "../html5";
import { YouTubeAPISource, YouTubeMeta } from "../youtube-api";
import { PlayerType } from "./source";
import { BasicPlayerStatus } from "./status";

interface PlayerStateBase {
  type: PlayerType | null;
  /**
   * player source details: urls, ids, etc.
   */
  source: PlayerSource | null;
  /**
   * metadata about the current media
   */
  meta: MediaMeta | null;
  /**
   * status of current player, readonly
   */
  status: BasicPlayerStatus | null;
  /**
   * indicate that user is using the progress bar to seek new currentTime,
   * one-way binding to the currentTime of the provider
   * (store -> provider)
   * changing back to null means user seek end and binding is revoked
   */
  userSeek: UserSeek | null;
  /** player UI state */
  interface: InterfaceState;
  /** used to request async actions */
  action: ActionState;
}

export interface NoMediaState extends PlayerStateBase {
  type: null;
  source: null;
  meta: null;
  status: null;
  userSeek: null;
}

export type PlayerSource = HTMLMediaSource | YouTubeAPISource | BilibiliSource;
export type MediaMeta =
  | ObsidianMeta
  | HTMLMediaMeta
  | YouTubeMeta
  | BilibiliMeta;

export interface WithMediaState extends PlayerStateBase {
  type: PlayerType;
  source: PlayerSource;
  meta: MediaMeta;
  status: PlayerStatus;
}
