import type { CachedMetadata, TAbstractFile } from "obsidian";
import { Notice, TFile, parseLinktext } from "obsidian";
import { openInOpenedPlayer } from "@/lib/link-click/opened";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/utils";
import { openInLeaf, parseUrl } from "../lib/link-click/external";
import { toURL } from "../lib/url";

export const mediaSourceField = {
  generic: "media",
  video: "video",
  audio: "audio",
} as const;

type MediaType = (typeof mediaSourceField)[keyof typeof mediaSourceField];

interface InternalLinkField {
  type: "internal";
  media: MediaType;
  source: string;
  original: string;
}
interface ExternalLinkField {
  type: "external";
  media: MediaType;
  source: URL;
}

export function handleMediaNote(this: MxPlugin) {
  const { metadataCache, workspace } = this.app;
  this.registerEvent(
    workspace.on("file-menu", (menu, file, _source, _leaf) => {
      const mediaInfo = getMediaInfo(file);
      if (!mediaInfo) return;
      menu.addItem((item) =>
        item
          .setSection("view")
          .setIcon("play")
          .setTitle("Open linked media")
          .onClick(() => openMedia(mediaInfo, file as TFile)),
      );
    }),
  );
  async function openMedia(
    mediaInfo: InternalLinkField | ExternalLinkField,
    file: TFile,
  ) {
    const leaf = workspace.getLeaf("split", "vertical");
    if (mediaInfo.type === "internal") {
      const linkFile = resolveLink(mediaInfo.source, file as TFile);
      if (!linkFile) {
        new Notice(`Cannot resolve media file from link ${mediaInfo.original}`);
        return;
      }
      await leaf.openFile(linkFile.file, {
        eState: { subpath: linkFile.subpath },
      });
    } else {
      const urlInfo = parseUrl(mediaInfo.source.href);
      if (!urlInfo) {
        new Notice(
          `Failed to open media url ${mediaInfo.source.href}, invalid url or not supported`,
        );
        return;
      }
      if (openInOpenedPlayer(urlInfo, workspace)) return;
      await openInLeaf(urlInfo, leaf);
    }
  }
  function getMediaInfo(
    file: TAbstractFile,
  ): ExternalLinkField | InternalLinkField | null {
    if (!(file instanceof TFile)) return null;
    const meta = metadataCache.getFileCache(file);
    if (!meta) return null;
    const video = getField(mediaSourceField.video, meta),
      audio = getField(mediaSourceField.audio, meta),
      generic = getField(mediaSourceField.generic, meta);
    // prefer explicit typed media
    const mediaField = video || audio || generic;
    if (!mediaField) return null;

    return mediaField;
  }

  function resolveLink(linktext: string, file: TFile) {
    const { path: linkpath, subpath } = parseLinktext(linktext);
    const mediaFile = metadataCache.getFirstLinkpathDest(linkpath, file.path);
    if (!mediaFile) return null;
    // if local file, prefer detect media type
    const mediaType = checkMediaType(mediaFile.extension);
    if (!mediaType) return null;
    return { file: mediaFile, subpath };
  }
}

function getField(
  key: MediaType,
  meta: CachedMetadata,
): InternalLinkField | ExternalLinkField | null {
  const { frontmatter, frontmatterLinks } = meta;
  if (!frontmatter || !(key in frontmatter)) return null;
  const internalLink = frontmatterLinks?.find((link) => link.key === key);
  if (internalLink) {
    return {
      type: "internal",
      media: key,
      source: internalLink.link,
      original: internalLink.original,
    };
  }
  const content = frontmatter[key];
  if (typeof content !== "string") return null;
  const url = toURL(content);
  if (!url) return null;
  return {
    type: "external",
    media: key,
    source: url,
  };
}
