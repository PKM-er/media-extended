import "obsidian";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
    plugins: {
      plugins: {
        [key: string]: any;
      };
    };
  }
}
