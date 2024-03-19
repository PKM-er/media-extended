import { parseLinktext } from "obsidian";
import type { MetadataCache, CachedMetadata, TFile } from "obsidian";
import { checkMediaType } from "@/info/media-type";
import type MxPlugin from "@/mx-main";
import { type MediaInfo } from "../../info/media-info";
import type { MediaSourceFieldType } from "./def";
import { mediaSourceFieldMap } from "./def";

export function getMediaNoteMeta(
  file: TFile,
  { metadataCache, plugin }: { metadataCache: MetadataCache; plugin: MxPlugin },
): MediaInfo | null {
  const meta = metadataCache.getFileCache(file);
  if (!meta) return null;
  const ctx = { metadataCache, sourcePath: file.path, plugin };

  // prefer explicit typed media
  return (
    getField(mediaSourceFieldMap.video, meta, ctx) ??
    getField(mediaSourceFieldMap.audio, meta, ctx) ??
    getField(mediaSourceFieldMap.generic, meta, ctx)
  );
}
function getField(
  key: MediaSourceFieldType,
  meta: CachedMetadata,
  ctx: { metadataCache: MetadataCache; sourcePath: string; plugin: MxPlugin },
): MediaInfo | null {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter || !(key in frontmatter)) return null;
  const linkCache = frontmatterLinks?.find((link) => link.key === key);
  if (linkCache) {
    const { path: linkpath, subpath } = parseLinktext(linkCache.link);
    const mediaFile = ctx.metadataCache.getFirstLinkpathDest(
      linkpath,
      ctx.sourcePath,
    );
    if (!mediaFile) return null;
    // if local file, prefer detect media type
    const mediaType = checkMediaType(mediaFile.extension);
    if (!mediaType) return null;
    return {
      type: mediaType,
      file: mediaFile,
      hash: subpath,
    };
  }
  const content = frontmatter[key];
  if (typeof content !== "string") return null;
  return ctx.plugin.resolveUrl(content);
}
