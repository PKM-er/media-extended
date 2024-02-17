export function getUserAgent(ua: string) {
  return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  return ua.replaceAll(/(?:Electron|obsidian)\/\S+ ?/g, "");
}
