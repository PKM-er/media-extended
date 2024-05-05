// handle url/file/website -> transcript; transcript -> url/file/website
// handle transcript resolution, fetching, and caching

import type { ParsedCaptionsResult } from "media-captions";
import type { App } from "obsidian";
import { TFile, Component, requestUrl } from "obsidian";
import { isFileMediaInfo, type MediaInfo } from "@/info/media-info";
import type {
  LoadedTextTrack,
  LocalTrack,
  ParsedTextTrack,
  RemoteTrack,
  TextTrackInfo,
} from "@/info/track-info";
import { isSupportedCaptionExt } from "@/info/track-info";
import type { FileInfo } from "@/lib/iter-sibling";
import type MxPlugin from "@/mx-main";
import { readFile } from "@/web/session/utils";
import { parseTrack } from "../stringify";
import {
  resolveInvaultMediaForTrack,
  resolveLocalMediaForTrack,
} from "./resolve/media";
import { resolveInvaultTracks, resolveLocalTracks } from "./resolve/track";

export class TranscriptLoader extends Component {
  constructor(public plugin: MxPlugin) {
    super();
    this.app = plugin.app;
  }
  app: App;

  // #region caption file loading
  async loadCaption(file: FileInfo): Promise<ParsedCaptionsResult | null> {
    if (!isSupportedCaptionExt(file.extension)) return null;
    const content = await this.#readFile(file);
    return parseTrack(content, { type: file.extension });
  }

  #readFile(file: FileInfo) {
    return file instanceof TFile
      ? this.app.vault.cachedRead(file)
      : readFile(file.path);
  }
  async #loadFromURL(url: string | URL) {
    const resp = await requestUrl({ url: url.toString(), method: "GET" });
    return resp.text;
  }

  async loadAndParseTrack(track: TextTrackInfo): Promise<ParsedTextTrack> {
    const content: string =
      track.src instanceof URL
        ? await this.#loadFromURL(track.src)
        : await this.#readFile(track.src);
    return {
      ...track,
      content: await parseTrack(content, { type: track.type }),
    };
  }
  async loadTrack(track: TextTrackInfo): Promise<LoadedTextTrack> {
    const content: string =
      track.src instanceof URL
        ? await this.#loadFromURL(track.src)
        : await this.#readFile(track.src);
    return { ...track, content };
  }
  async loadTracks(...tracks: TextTrackInfo[]): Promise<LoadedTextTrack[]> {
    const loaded = await Promise.all(tracks.map((t) => this.loadTrack(t)));
    return loaded.filter((t) => !!t.content.trim());
  }
  // #endregion

  async getTracks(media: MediaInfo): Promise<LoadedTextTrack[]> {
    try {
      const localTracks = await (isFileMediaInfo(media)
        ? resolveInvaultTracks(media.file)
        : resolveLocalTracks(media));
      const linkedTracks = this.plugin.mediaNote.getLinkedTextTracks(media);
      return this.loadTracks(...localTracks, ...linkedTracks);
    } catch (e) {
      console.error(
        `Failed to get tracks for ${
          isFileMediaInfo(media) ? media.file.path : media.toString()
        }`,
        e,
      );
      return [];
    }
  }

  async getLinkedMedia(track: TextTrackInfo): Promise<MediaInfo[]> {
    const linkedMedia = this.plugin.mediaNote.getLinkedMedia(track);
    if (!isRemoteTrack(track)) {
      const byFilePath = isTrackInVault(track)
        ? await resolveInvaultMediaForTrack(track)
        : await resolveLocalMediaForTrack(track);
      if (byFilePath) linkedMedia.push(byFilePath);
    }
    return linkedMedia;
  }
}

function isTrackInVault(
  track: LocalTrack<FileInfo>,
): track is LocalTrack<TFile> {
  return track.src instanceof TFile;
}

function isRemoteTrack(track: TextTrackInfo): track is RemoteTrack {
  return track.src instanceof URL;
}
