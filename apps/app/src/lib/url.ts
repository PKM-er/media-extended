export function noHash(url: URL) {
  return url.hash ? url.href.slice(0, -url.hash.length) : url.href;
}

export function toURL(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
