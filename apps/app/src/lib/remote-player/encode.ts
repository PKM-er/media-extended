export function encodeWebpageUrl(url: string): string {
  return `webpage::${btoa(url)}`;
}

export function decodeWebpageUrl(url: string): string {
  return atob(url.replace(/^webpage::/, ""));
}

export function isWebpageUrl(url: string): boolean {
  return url.startsWith("webpage::");
}
