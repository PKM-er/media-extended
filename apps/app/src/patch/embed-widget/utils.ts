export const getUrlFromMarkdown = (text: string): string => {
  text = text.trim();
  if (text.startsWith("<")) {
    const trailing = text.indexOf(">");
    if (-1 !== trailing) return text.substring(1, trailing);
  }
  const matches = text.match(/\s/);
  return matches ? text.substring(0, matches.index) : text;
};
export const isMdFavorInternalLink = (e: string) => {
  return (
    !(!e.startsWith("./") && !e.startsWith("../")) || -1 === e.indexOf(":")
  );
};
export const parseLinktextAlias = (linktext: string) => {
  let title = "";
  const pipeLoc = linktext.indexOf("|"),
    hasAlias = pipeLoc > 0;

  if (hasAlias) {
    title = linktext.substring(pipeLoc + 1).trim();
    linktext = linktext.substring(0, pipeLoc).trim();
  } else {
    linktext = linktext.trim();
    title = getAltTextForInternalLink(linktext);
  }
  if (linktext.endsWith("\\")) {
    linktext = linktext.substring(0, linktext.length - 1);
  }
  return {
    href: normalizeSpace(linktext).trim(),
    title: title,
    isAlias: hasAlias,
  };
};

const getAltTextForInternalLink = (text: string) => {
  return text
    .split("#")
    .filter((e) => !!e)
    .join(" > ")
    .trim();
};

const NO_BREAK_SPACE = /\u00A0/g;
export const normalizeSpace = (text: string) => {
  return text.replaceAll(NO_BREAK_SPACE, " ");
};
