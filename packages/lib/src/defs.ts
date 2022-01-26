export const enum MediaType {
  Audio = "audio",
  Video = "video",
  /** media that cannot determine if audio or video */
  Unknown = "media",
}

export const enum MediaInfoType {
  /** internal file inside obsidian vault */
  Obsidian,
  /** direct link to media file */
  Direct,
  /** media hosted in media platform */
  Host,
}

interface MediaInfoBase {
  from: MediaInfoType;
  src: string | URL;
  /** starts with "#" */
  hash: string;
}

export interface ObsidianMediaInfo extends MediaInfoBase {
  from: MediaInfoType.Obsidian;
  type: MediaType;
  filename: string;
  /** relative path for media file */
  src: string;
  /** paths for subtitles, could be empty */
  subtitles: string[];
}

export interface DirectLinkInfo extends MediaInfoBase {
  from: MediaInfoType.Direct;
  src: URL;
  type: MediaType;
  filename: string;
}

export interface HostMediaInfo extends MediaInfoBase {
  from: MediaInfoType.Host;
  src: URL;
  host: string;
  id: string;
  iframe?: URL;
}
