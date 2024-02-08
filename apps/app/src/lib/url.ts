export function noHash(url: URL | string) {
  return noHashUrl(url).href;
}

export function noHashUrl(url: URL | string): URL {
  const newUrl = new URL(url);
  newUrl.hash = "";
  return newUrl;
}

export function toURL(url: string | URL): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
