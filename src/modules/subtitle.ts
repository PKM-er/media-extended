import MediaExtended from "main";
import { TAbstractFile, TFile } from "obsidian";
import iso from "iso-639-1";
import { Track } from "plyr";
import { parseSync, stringifySync } from "subtitle";
import { join } from "node:path";

export function getSubtitles(video: TFile): TFile[] | null {
  const { basename: videoName, parent: folder } = video;

  // for video file "hello.mp4"
  // vaild subtitle: "./hello.en.srt"
  const subtitles = folder.children.filter((file) => {
    // filter file only (exclude folder)
    if (!(file instanceof TFile)) return false;
    const isSubtitle = file.extension === "srt" || file.extension === "vtt";
    const isSameFile = file.basename.startsWith(videoName);
    if (isSubtitle && isSameFile) {
      const languageSuffix = file.basename.slice(videoName.length);
      return (
        languageSuffix.startsWith(".") &&
        iso.validate(languageSuffix.substring(1))
      );
    } else return false;
  }) as TFile[];

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

export async function toVtt(
  srtFile: TFile,
  plugin: MediaExtended,
): Promise<TFile> {
  const srt = await plugin.app.vault.read(srtFile);
  const vtt = stringifySync(parseSync(srt), { format: "WebVTT" });
  return plugin.app.vault.create(
    join(srtFile.parent.path, srtFile.basename + ".vtt"),
    vtt,
  );
}

/**
 *
 * @param video
 * @returns empty array if no subtitle exists
 */
export async function getSubtitleTracks(
  video: TFile,
  plugin: MediaExtended,
): Promise<Track[]> {
  const subFiles = getSubtitles(video);
  if (!subFiles) {
    console.log("no subtitle found");
    return [];
  }

  // convert all srt to vtt
  for (let i = subFiles.length - 1; i >= 0; i--) {
    const sub = subFiles[i];
    if (sub.extension !== "srt") continue;
    try {
      subFiles[i] = await toVtt(sub, plugin);
    } catch (error) {
      console.error(error, sub);
      subFiles.splice(i, 1);
    }
  }
  if (subFiles.length === 0) {
    console.error("no vtt subtitle availble");
    return [];
  }

  return subFiles.map((file) => {
    const languageCode = file.basename.split(".").pop();
    if (!languageCode || !iso.validate(languageCode))
      throw new Error(
        "languageCode unable to parse, problem with getSubtitles()? ",
      );

    return {
      kind: "captions",
      label: iso.getNativeName(languageCode),
      srclang: languageCode,
      src: plugin.app.vault.getResourcePath(file),
      default:
        navigator.language.substring(0, 2) === languageCode ? true : undefined,
    };
  });
}
