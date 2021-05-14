import MediaExtended from "main";
import { MarkdownRenderChild, TFile } from "obsidian";
import iso from "iso-639-1";
import SrtCvt from "srt-webvtt";

function getSubtitles(video: TFile): TFile[] | null {
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

  if (subtitles.length === 0) return null;
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

    return subtitles;
  }
}

async function getSrtUrl(file: TFile, plugin: MediaExtended): Promise<string> {
  const srt = await plugin.app.vault.read(file);
  return new SrtCvt(new Blob([srt])).getURL();
}

async function getVttURL(file: TFile, plugin: MediaExtended) {
  const blob = new Blob([await plugin.app.vault.read(file)], {
    type: "text/vtt",
  });
  return URL.createObjectURL(blob);
}

/**
 *
 * @param video
 * @returns empty [objectUrl[], trackEl[]] if no subtitle exists
 */
export async function getSubtitleTracks(
  video: TFile,
  plugin: MediaExtended,
): Promise<{ objUrls: string[]; tracks: HTMLTrackElement[] } | null> {
  const subFiles = getSubtitles(video);
  if (!subFiles) return null;

  console.log(
    "found subtitle(s): %o",
    subFiles.map((v) => v.name),
  );

  if (subFiles.length === 0) {
    console.error("no vtt subtitle availble");
    return null;
  }

  const url: Map<TFile, string> = new Map();
  for (const file of subFiles) {
    if (file.extension === "srt") {
      url.set(file, await getSrtUrl(file, plugin));
    } else url.set(file, await getVttURL(file, plugin));
  }

  const tracks = subFiles.map((file, i, array) => {
    const languageCode = file.basename.split(".").pop();
    let label: string | null = null;
    let srclang: string | null = null;
    if (array.length > 1) {
      if (!languageCode || !iso.validate(languageCode))
        throw new Error(
          "languageCode unable to parse, problem with getSubtitles()? ",
        );
      label = iso.getNativeName(languageCode);
      srclang = languageCode;
    }

    const attr = {
      kind: "captions",
      label,
      srclang,
      src: url.get(file) as string,
    };
    return createEl("track", { attr }, (el) => {
      if (navigator.language.substring(0, 2) === languageCode) {
        el.setAttr("default", "");
      }
    });
  });

  return { objUrls: [...url.values()], tracks };
}

export class SubtitleResource extends MarkdownRenderChild {
  objectUrls: string[];

  constructor(containerEl: HTMLDivElement, objectUrls: string[]) {
    super();
    this.containerEl = containerEl;
    this.objectUrls = objectUrls;
  }

  unload() {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
  }
}
