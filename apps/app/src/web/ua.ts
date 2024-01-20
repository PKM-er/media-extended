export function getUserAgent(ua: string) {
  return ua.replaceAll(/(?:Electron|obsidian)\/\S+ ?/g, "");
}
