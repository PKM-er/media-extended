export type Size = [width: number, height: number];

// a pattern that accept 1x2 or x2 or 1 or 1x
const sizeSyntax = /^(?<x>\d+)?x(?<y>\d+)$|^(?<xOnly>\d+)$/;

function toInt(num: string) {
  const n = parseInt(num, 10);
  return Number.isNaN(n) ? -1 : n;
}

export const parseSizeSyntax = (str: string | undefined): Size | null => {
  const match = str?.match(sizeSyntax)?.groups;
  if (!match) return null;
  const x = toInt(match.xOnly ?? match.x);
  const y = toInt(match.y);
  return [x, y];
};

export const parseSizeFromLinkTitle = (
  linkTitle: string,
): [title: string, size: Size | null] => {
  const pipeLoc = linkTitle.lastIndexOf("|");
  let size,
    title = linkTitle;
  if (pipeLoc === -1) {
    size = parseSizeSyntax(linkTitle);
    if (size) title = "";
  } else {
    size = parseSizeSyntax(title.substring(pipeLoc + 1));
    if (size) title = title.substring(0, pipeLoc);
  }
  return [title, size];
};
