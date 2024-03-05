import filenamify from "filenamify/browser";

/**
 * normalize a string to be used as a file name in obsidian
 */
export function normalizeFilename(input: string): string {
  return filenamify(input, {
    replacement: "_",
  }).replaceAll(/[[\]#^|]/g, "_");
}
