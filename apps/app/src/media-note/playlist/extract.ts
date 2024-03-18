/* eslint-disable @typescript-eslint/naming-convention */
import { parseLinktext } from "obsidian";
import type {
  CachedMetadata,
  Pos,
  LinkCache,
  ListItemCache,
  TFile,
} from "obsidian";
import type { MediaInfo } from "@/media-view/media-info";
import { mediaInfoFromFile } from "@/media-view/media-info";
import type MxPlugin from "@/mx-main";
import { mediaTitle } from "../title";
import { isMediaTaskSymbol, taskSymbolMediaTypeMap } from "./def";
import type { MediaTaskSymbol, PlaylistItem, Playlist } from "./def";
import {
  extractFirstMarkdownLink,
  extractListItemMainText,
  parseMarkdown,
} from "./syntax";

export async function getPlaylistMeta(
  file: TFile,
  plugin: MxPlugin,
): Promise<Playlist | null> {
  const meta = plugin.app.metadataCache.getFileCache(file);
  if (!meta) return null;
  const ctx = { source: file, plugin };
  const list = await parsePlaylist(meta, ctx);
  if (!list) return null;
  return {
    // by default autoplay is true
    autoplay: !(meta.frontmatter?.autoplay === false),
    title: getFileTitle(meta, file),
    list,
    file,
  };
}

async function parsePlaylist(
  meta: CachedMetadata,
  ctx: {
    source: TFile;
    plugin: MxPlugin;
  },
): Promise<PlaylistItem[] | null> {
  const { metadataCache, vault } = ctx.plugin.app;
  const { frontmatter } = meta;
  if (frontmatter?.playlist !== true || !meta.sections || !meta.listItems)
    return null;

  // only consider the first list section
  const listSection = meta.sections.find((s) => s.type === "list");
  if (!listSection) return [];
  const withinListSection = (item: { position: Pos }) =>
    within(item, listSection);
  const listItems = toPlaylistItems(meta.listItems.filter(withinListSection));

  const links = meta.links?.filter(withinListSection) ?? [];
  const fileContent = await vault.cachedRead(ctx.source);
  const playlist = listItems.map((listItem, _i, arr): PlaylistItem => {
    const internalLinkIdx = links.findIndex((link) => within(link, listItem));
    const { parent: _parent, task } = listItem;
    const type = task && taskSymbolMediaTypeMap[task];

    // convert start_line-based indexing to array_index-based indexing
    const parent =
      _parent >= 0
        ? arr.findIndex((li) => li.position.start.line === _parent)
        : -1;
    if (internalLinkIdx !== -1) {
      // remove all links within the list item
      const internalLink = links[internalLinkIdx];
      const last = links.findLastIndex((link) => within(link, listItem));
      links.splice(internalLinkIdx, last - internalLinkIdx + 1);
      const media = mediaInfoFromInternalLink(internalLink);
      return {
        media,
        type: type ?? "generic",
        parent,
        title: internalLink.displayText ?? "",
      };
    }
    // handle external links
    const text = extractText(fileContent, listItem.position);
    const syntax = parseMarkdown(text);
    const externalLink = extractFirstMarkdownLink(text, syntax);
    if (externalLink) {
      const { url } = externalLink;
      const media = ctx.plugin.resolveUrl(url);
      let { display } = externalLink;
      if (media && (display === url || !display)) {
        display = mediaTitle(media);
      }
      return { media, title: display, type: type || "generic", parent };
    }
    return {
      media: null,
      title: extractListItemMainText(text, syntax) || "Item",
      type: type || "chapter",
      parent,
    };
  });
  return playlist;

  function mediaInfoFromInternalLink({ link }: LinkCache): MediaInfo | null {
    const { path, subpath } = parseLinktext(link);
    const file = metadataCache.getFirstLinkpathDest(path, ctx.source.path);
    return mediaInfoFromFile(file, subpath);
  }
}

function toPlaylistItems(
  list: ListItemCache[],
): (ListItemCache & { task?: MediaTaskSymbol })[] {
  return list.map(({ task, ...i }) =>
    isMediaTaskSymbol(task) ? { task, ...i } : i,
  );
}
function getFileTitle(meta: CachedMetadata, file: TFile): string {
  return (
    meta.frontmatter?.title?.trim() ||
    meta.headings?.find((h) => h.level === 1)?.heading?.trim() ||
    file.basename.trim()
  );
}
function within(item: { position: Pos }, parent: { position: Pos }) {
  return (
    item.position.start.offset >= parent.position.start.offset &&
    item.position.end.offset <= parent.position.end.offset
  );
}

function extractText(text: string, range: Pos) {
  return text.slice(range.start.offset, range.end.offset);
}
