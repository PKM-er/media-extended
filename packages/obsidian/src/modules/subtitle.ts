import iso from "iso-639-1";
import { MarkdownRenderChild, TAbstractFile, TFile, Vault } from "obsidian";
import Plyr from "plyr";
import SrtCvt from "srt-webvtt";

export const getSubtitles = (video: TFile): TFile[] => {
  const { basename: videoName, parent: folder } = video;

  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)
  let subtitles = folder.children.filter((file) => {
    // filter file only (exclude folder)
    if (!(file instanceof TFile)) return false;
    const isSubtitle = file.extension === "srt" || file.extension === "vtt";
    const isSameFile = file.basename.startsWith(videoName);
    return isSubtitle && isSameFile;
  }) as TFile[];
  if (subtitles.length > 1) {
    subtitles = subtitles.filter((file) => {
      const languageSuffix = file.basename.slice(videoName.length);
      return (
        languageSuffix.startsWith(".") &&
        iso.validate(languageSuffix.substring(1))
      );
    });
  }

  if (subtitles.length === 0) return subtitles;
  else {
    const vttNames = subtitles
      .filter((file) => file.extension === "vtt")
      .map((file) => file.basename);

    // use vtt in favor of srt if both format exists
    for (let i = subtitles.length - 1; i >= 0; i--) {
      const sub = subtitles[i];
      if (sub.extension === ".srt" && vttNames.includes(sub.basename))
        subtitles.splice(i, 1);
    }
    console.log(
      "found subtitle(s): %o",
      subtitles.map((v) => v.name),
    );
    return subtitles;
  }
};

const getSrtUrl = async (file: TFile, vault: Vault): Promise<string> => {
  const srt = await vault.read(file);
  return new SrtCvt(new Blob([srt])).getURL();
};

const getVttURL = async (file: TFile, vault: Vault) => {
  const blob = new Blob([await vault.read(file)], {
    type: "text/vtt",
  });
  return URL.createObjectURL(blob);
};

export type trackInfo = {
  objUrls: string[];
  trackEls: HTMLTrackElement[];
  tracks: Plyr.Track[];
};

/**
 *
 * @param video
 * @returns empty [objectUrl[], trackEl[]] if no subtitle exists
 */
export const getSubtitleTracks = async (
  subtitles: TFile[] | string[],
  vault: Vault,
): Promise<trackInfo> => {
  const url: Map<TFile, string> = new Map();
  for (const src of subtitles) {
    let file: TFile;
    let aFile: TAbstractFile | null;
    if (typeof src === "string") {
      if ((aFile = vault.getAbstractFileByPath(src)) && aFile instanceof TFile)
        file = aFile;
      else {
        console.warn("no subFile found for path: %s", src);
        continue;
      }
    } else file = src;

    if (file.extension === "srt") {
      url.set(file, await getSrtUrl(file, vault));
    } else url.set(file, await getVttURL(file, vault));
  }

  const tracks: Plyr.Track[] = [];
  const trackEls: HTMLTrackElement[] = [];
  for (const file of url.keys()) {
    const languageCode = file.basename.split(".").pop();
    let label: string | null = null;
    let srclang: string | null = null;
    if (url.size > 1) {
      if (!languageCode || !iso.validate(languageCode))
        throw new Error(
          "languageCode unable to parse, problem with getSubtitles()? ",
        );
      label = iso.getNativeName(languageCode);
      srclang = languageCode;
    }

    const track: Plyr.Track = {
      kind: "captions",
      label: label ?? "default",
      srcLang: srclang ?? undefined,
      src: url.get(file) as string,
    };
    const trackEl = createEl(
      "track",
      {
        attr: {
          kind: "captions",
          label,
          srclang,
          src: url.get(file) as string,
        },
      },
      (el) => {
        if (navigator.language.substring(0, 2) === languageCode) {
          el.setAttr("default", "");
        }
      },
    );

    trackEls.push(trackEl);
    tracks.push(track);
  }

  return { objUrls: [...url.values()], trackEls, tracks };
};

export class MediaResource extends MarkdownRenderChild {
  objectUrls?: string[];
  player: Plyr;

  constructor(
    containerEl: HTMLDivElement,
    player: Plyr,
    objectUrls?: string[],
  ) {
    super(containerEl);
    this.objectUrls = objectUrls ?? [];
    this.player = player;
  }

  unload() {
    if (this.objectUrls)
      this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.player.destroy();
  }
}
