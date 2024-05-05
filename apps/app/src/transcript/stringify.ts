/* eslint-disable @typescript-eslint/naming-convention */
import { escapeRegExp, mapValues } from "lodash-es";
import type { ParseCaptionsOptions } from "media-captions";
import { parseText } from "media-captions";
import { moment } from "obsidian";
import type { VTTContent } from "./handle/type";

function time(seconds: number) {
  // Create a moment object starting from zero
  const base = moment.utc(0);

  // Add the seconds to the moment object
  base.add(seconds, "seconds");

  // Format the output to "hh:mm:ss.SSS"
  // `.SSS` will ensure the millisecond precision is 3 decimal places
  return base.format("HH:mm:ss.SSS");
}

// Map of characters to be escaped and their escape sequences
const escapeMap: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "=": "&#61;", // ASCII code for '='
  ":": "&#58;", // ASCII code for ':'
};
const escapeRegex = new RegExp(
  `[${escapeRegExp(Object.keys(escapeMap).join(""))}]`,
  "g",
);
const revEscapeMap = Object.fromEntries(
  Object.entries(escapeMap).map(([k, v]) => [v, k]),
);
const revEscapeRegex = new RegExp(
  `(${Object.keys(revEscapeMap).map(escapeRegExp).join("|")})`,
  "g",
);

function normalizeComment(comment: string): string {
  // Escape '-->' first to prevent partial replacement by the other mappings
  comment = comment.replace(/-->/g, "");
  // Escape other characters using the map
  return comment.replaceAll(escapeRegex, (char) => escapeMap[char]);
}

function unescapeComment(comment: string): string {
  return comment.replaceAll(revEscapeRegex, (char) => revEscapeMap[char]);
}

/**
 * @returns WebVTT string
 */
export function stringifyTrack(
  { cues, metadata = {}, regions = [] }: VTTContent,
  meta: Record<string, string | undefined> = {},
) {
  const metadataLines = [
    ...Object.entries({ ...metadata, ...meta })
      .map(([k, v]) => (v ? `${k}: ${normalizeComment(v)}` : undefined))
      .filter((v): v is string => !!v),
    "",
  ];
  const cueLines = cues.flatMap((cue) => {
    const { id, startTime, endTime, text } = cue;
    return [id, `${time(startTime)} --> ${time(endTime)}`, text, ""];
  });
  const regionLines = regions.flatMap((region) => {
    const { id, ...rest } = region;
    return [
      "REGION",
      `id:${id}`,
      ...Object.entries(rest).map(([k, v]) => `${k}:${v}`),
      "",
    ];
  });
  return ["WEBVTT", ...metadataLines, ...cueLines, ...regionLines].join("\n");
}

export async function parseTrack(content: string, opts: ParseCaptionsOptions) {
  const data = await parseText(content, opts);
  data.metadata = mapValues(data.metadata, (v) => unescapeComment(v));
  return data;
}
