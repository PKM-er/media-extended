export function noHash(url: URL) {
  return noHashUrl(url).href;
}

export function noHashUrl(url: URL | string): URL {
  const newUrl = new URL(url);
  newUrl.hash = "";
  return newUrl;
}

export function toURL(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
