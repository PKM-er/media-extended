import { parseLinktext } from "obsidian";
import type { TFile, CachedMetadata } from "obsidian";
import { parseTrackUrl, toTrack, type TextTrackInfo } from "@/info/track-info";

export const textTrackFmField = {
  subtitles: {
    singular: "subtitle",
    plural: "subtitles",
  },
  captions: {
    singular: "caption",
    plural: "captions",
  },
} as const;
const textTrackKinds = Object.keys(
  textTrackFmField,
) as (keyof typeof textTrackFmField)[];

export function parseTextTrackFields(
  meta: CachedMetadata,
  resolveFile: (linkpath: string) => TFile | null,
) {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter) return [];
  return textTrackKinds.reduce<TextTrackInfo[]>((info, kind) => {
    const field = textTrackFmField[kind];
    let value: unknown = frontmatter[field.plural];
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((v): v is string => typeof v === "string")
    ) {
      info.push(
        ...value
          .map((value, i) =>
            toTrackInfo({ value, key: `${field.plural}.${i}` }),
          )
          .filter((v): v is TextTrackInfo => !!v),
      );
      return info;
    }
    value = frontmatter[field.singular];
    if (typeof value === "string" && value) {
      const trackInfo = toTrackInfo({ value, key: field.singular });
      if (trackInfo) info.push(trackInfo);
      return info;
    }
    function toTrackInfo({ value, key }: { value: string; key: string }) {
      const fmLink = frontmatterLinks?.find((l) => l.key === key);
      if (fmLink) {
        const { path, subpath } = parseLinktext(fmLink.link);
        const file = resolveFile(path);
        if (!file) return null;
        const track = toTrack(file, {
          kind,
          subpath,
          alias: fmLink.displayText,
        });
        if (track) return track;
      } else {
        const url = parseTrackUrl(value, { kind });
        if (url) return url;
      }
      return null;
    }
    return info;
  }, []);
}
