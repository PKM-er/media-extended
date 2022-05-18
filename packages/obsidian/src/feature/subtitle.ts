import type { Track } from "@slice/source/types";
import iso from "iso-639-1";
import { TFile } from "obsidian";
import toVtt from "srt-webvtt";

const getSubtitles = (video: TFile): TFile[] => {
  const { basename: videoName, parent: folder } = video;

  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)
  let subtitles = folder.children.filter((file) => {
    // filter file only (exclude folder)
    if (!(file instanceof TFile)) return false;
    const isSubtitle = file.extension === "srt" || file.extension === "vtt",
      isSameFile = file.basename.startsWith(videoName);
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

const getSrtUrl = async (file: TFile): Promise<string> => {
  const content = await app.vault.readBinary(file),
    blob = new Blob([content], { type: "text/plain" });
  return toVtt(blob);
};

const getVttURL = async (file: TFile) => {
  const content = await app.vault.readBinary(file),
    blob = new Blob([content], { type: "text/vtt" });
  return URL.createObjectURL(blob);
};

/**
 *
 * @param video
 * @returns empty [objectUrl[], trackEl[]] if no subtitle exists
 */
const getSubtitleTracks = async (subtitles: TFile[]) => {
  const url: [file: TFile, url: string][] = [];
  const result = await Promise.allSettled(
    subtitles.map(async (file) => {
      if (file.extension === "srt") {
        url.push([file, await getSrtUrl(file)]);
      } else url.push([file, await getVttURL(file)]);
    }),
  );
  result
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .forEach(({ reason }) =>
      console.log("failed to load subtitle: %o", reason),
    );

  return url.reduce<Track[]>((arr, [file, src], _i, { length: size }) => {
    const languageCode = file.basename.split(".").pop();
    let props: { label?: string; srcLang?: string; default: boolean };
    if (size > 1) {
      if (!languageCode || !iso.validate(languageCode)) {
        console.error(
          "languageCode unable to parse, problem with getSubtitles()? ",
        );
        return arr;
      }
      props = {
        label: iso.getNativeName(languageCode),
        srcLang: languageCode,
        default: isDefaultLang(languageCode),
      };
    } else {
      props = {
        label: languageCode ? iso.getNativeName(languageCode) : "Default",
        default: true,
      };
    }
    arr.push({ kind: "subtitles", src, ...props });
    return arr;
  }, []);
};

const getTracks = async (video: TFile) => {
  const subtitles = getSubtitles(video);
  if (subtitles.length === 0) return [];
  return getSubtitleTracks(subtitles);
};
export default getTracks;

export const isDefaultLang = (languageCode: string) =>
  (localStorage.language ?? "en") === languageCode;
