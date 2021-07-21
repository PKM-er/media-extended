import "obsidian";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
  }
}
