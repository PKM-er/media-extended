export function encodeWebpageUrl(url: string): string {
  return `webpage::${btoa(url)}`;
}

export function decodeWebpageUrl(url: string): string {
  return atob(url.replace(/^webpage::/, ""));
}

export function isWebpageUrl(url: unknown): boolean {
  return typeof url === "string" && url.startsWith("webpage::");
}
