import { upperFirst } from "lodash-es";
import type { Menu } from "obsidian";
import { Notice, normalizePath, TFile } from "obsidian";
import { sortTrack } from "@/components/use-tracks";
import { MediaURL } from "@/info/media-url";
import { textTrackFmField, type WebsiteTextTrack } from "@/info/track-info";
import { getSaveFolder } from "@/lib/folder";
import { langCodeToLabel } from "@/lib/lang/lang";
import { normalizeFilename } from "@/lib/norm";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { uniq } from "@/lib/uniq";
import { mediaTitle } from "@/media-note/title";
import { stringifyTrack } from "@/transcript/stringify";
import type { PlayerContext } from ".";

export function transcriptMenu(menu: Menu, ctx: PlayerContext) {
  if (ctx.tracks.local.length === 0 && ctx.tracks.remote.length === 0) return;

  const tracks = [
    ...ctx.tracks.local.map((t) => ({ ...t, _type: "local" as const })),
    ...ctx.tracks.remote.map((t) => ({ ...t, _type: "remote" as const })),
  ];
  menu.addItem((item) => {
    const submenu = item
      .setSection("view")
      .setTitle("Open transcript")
      .setIcon("subtitles")
      .setSubmenu();

    tracks.sort(sortTrack).forEach((t, idx) => {
      const label =
        t.label ||
        langCodeToLabel(t.language) ||
        t.wid ||
        `${upperFirst(t.kind)} ${idx + 1}`;
      submenu.addItem((item) =>
        item.setTitle(label).onClick(async () => {
          if (t._type === "remote") {
            const file = await saveTranscript(t, ctx);
            if (file) {
              ctx.plugin.app.workspace.openLinkText(file.path, "", "split");
            }
          } else if (t._type === "local") {
            if (t.src instanceof TFile) {
              if (ctx.plugin.app.vault.getFileByPath(t.src.path)) {
                ctx.plugin.app.workspace.openLinkText(t.src.path, "", "split");
              }
            } else {
              new Notice("Remote track not yet supported");
            }
          }
        }),
      );
    });
  });
}

async function saveTranscript(
  { wid: id, language, label, kind }: WebsiteTextTrack,
  { source, plugin, player }: PlayerContext,
): Promise<TFile | null> {
  const instance = player.provider;
  if (
    !(instance instanceof WebiviewMediaProvider) ||
    !(source instanceof MediaURL)
  ) {
    new Notice("Cannot save transcript from this media");
    return null;
  }
  try {
    const track = await instance.media.methods.getTrack(id);
    if (!track) {
      new Notice(`Failed to save transcript: track ${id} not found`);
      return null;
    }
    const content = stringifyTrack(track, {
      Source: source.jsonState.source,
      Title: mediaTitle(source, player),
      Language: language,
      Label: label,
    });

    const filename = normalizeFilename(
      [
        mediaTitle(source).replace(/\s+/gu, "").toLowerCase(),
        id.replaceAll(".", "_"),
        language,
        "vtt",
      ]
        .filter(Boolean)
        .join("."),
    )
      .replaceAll(/_+-+|-+_+/gu, "-")
      .replaceAll(/-{2,}/gu, "-")
      .replaceAll(/_{2,}$/gu, "_");

    const note = await plugin.mediaNote.getNote(source, player);
    const folder = await getSaveFolder(
      plugin.settings.getState().subtitleFolderPath,
      { plugin, sourcePath: note.path },
    );
    const filepath = normalizePath(`${folder.path}/${filename}`);
    let subtitle = plugin.app.vault.getFileByPath(filepath);
    if (subtitle) {
      await plugin.app.vault.modify(subtitle, content);
    } else {
      subtitle = await plugin.app.vault.create(filepath, content);
    }

    new Notice(`Transcript saved to ${subtitle.path}`);
    const { fileManager } = plugin.app;
    const alias = (label || language || id).trim();
    const link = fileManager
      .generateMarkdownLink(
        subtitle,
        note.path,
        `#wid=${encodeURIComponent(id)}`,
        alias,
      )
      .replace(/^!/u, "");
    const fieldNames = textTrackFmField[kind];
    const isString = (s: any): s is string => typeof s === "string";
    await plugin.app.fileManager.processFrontMatter(note, (fm) => {
      let prev: string[] = [];
      if (fieldNames.plural in fm) {
        // check if existing is vaild
        const value = fm[fieldNames.plural];
        if (!value) {
          prev = [];
        } else if (Array.isArray(value) && value.every(isString)) {
          prev = value;
        } else {
          new Notice(
            `Failed to save transcript: field \`${fieldNames.plural}\` in note ${note.path} is not an array of strings, you may need to fix it manually.`,
          );
          console.log("EXISTING", value);
          return;
        }
      } else if (fieldNames.singular in fm) {
        const value = fm[fieldNames.singular];
        if (!value) {
          prev = [];
        } else if (isString(value)) {
          prev = [value];
        } else {
          new Notice(
            `Failed to save transcript: field \`${fieldNames.singular}\` in note ${note.path} is not a string, you may need to fix it manually.`,
          );
          return;
        }
      }

      const next = uniq([
        ...prev.filter((v) => {
          // extract "wid=xxx" from the link
          const match = v.match(/#wid=(?<wid>[^&|)\]]+)/u);
          if (!match) return true;
          return match.groups!.wid !== id;
        }),
        link,
      ]);
      if (next.length === 1) {
        delete fm[fieldNames.plural];
        fm[fieldNames.singular] = link;
      } else {
        delete fm[fieldNames.singular];
        fm[fieldNames.plural] = next;
      }
    });
    return subtitle;
  } catch (e) {
    console.error("Failed to save transcript", e);
    if (e instanceof Error)
      new Notice(`Failed to save transcript: ${e.message}`);
    else new Notice("Failed to save transcript, for details see console.");
    return null;
  }
}
