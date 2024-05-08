import { parseLinktext } from "obsidian";
import type { App, CachedMetadata, TFile } from "obsidian";
import {
  parseTrackUrl,
  textTrackFmField,
  textTrackKinds,
  toTrack,
} from "@/info/track-info";
import type {
  LocalTrack,
  TextTrackInfo,
  TextTrackKind,
} from "@/info/track-info";

export type UnresolvedTrackLink = {
  type: "link";
  path: string;
  subpath: string;
  alias?: string;
  kind: TextTrackKind;
};

export function isUnresolvedTrackLink(
  info: MetaTextTrackInfo,
): info is UnresolvedTrackLink {
  return (info as UnresolvedTrackLink).type === "link";
}

export type MetaTextTrackInfo = TextTrackInfo | UnresolvedTrackLink;

/**
 * @returns TextTrackInfo with FileInfo being source.
 * FileInfo contains unresolved link path.
 */
export function parseTextTrackFields(meta: CachedMetadata) {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter) return [];
  return textTrackKinds.reduce<MetaTextTrackInfo[]>((info, kind) => {
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
        return {
          type: "link",
          path,
          subpath,
          kind,
          alias: fmLink.displayText,
        } satisfies UnresolvedTrackLink;
      } else {
        const url = parseTrackUrl(value, { kind });
        if (url) return url;
      }
      return null;
    }
    return info;
  }, []);
}

export function resolveTrackLink(
  { alias, kind, path, subpath }: UnresolvedTrackLink,
  sourcePath: string,
  { metadataCache }: App,
): LocalTrack<TFile> | null {
  const file = metadataCache.getFirstLinkpathDest(path, sourcePath);
  if (!file) return null;
  return toTrack(file, { kind, subpath, alias });
}
