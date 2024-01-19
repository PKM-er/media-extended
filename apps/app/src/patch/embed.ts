import type { EmbedCreator, Plugin } from "obsidian";
import { MediaFileExtensions } from "./media-type";
import { reloadMarkdownPreview } from "./utils";

export default function injectMediaEmbed(
  this: Plugin,
  embedCreator: EmbedCreator,
) {
  const { app } = this;
  (["video", "audio"] as const).forEach((type) => {
    const exts = MediaFileExtensions[type];
    const revertBackup = unregisterExistingEmbed(exts),
      unregister = registerEmbed(exts, embedCreator);
    this.register(() => {
      unregister();
      revertBackup();
    });
  });
  // reload to apply embed changes
  reloadMarkdownPreview(app.workspace);
  this.register(() => {
    // reload to revert embed changes
    reloadMarkdownPreview(app.workspace);
  });

  function registerEmbed(exts: string[], newCreator: EmbedCreator) {
    app.embedRegistry.registerExtensions(exts, newCreator);
    return () => {
      app.embedRegistry.unregisterExtensions(exts);
    };
  }
  function unregisterExistingEmbed(exts: string[]) {
    const creatorBackup: (EmbedCreator | undefined)[] = exts.map(
      (ext) => app.embedRegistry.embedByExtension[ext],
    );
    app.embedRegistry.unregisterExtensions(exts);
    return () => {
      exts.forEach((ext, i) => {
        const creator = creatorBackup[i];
        creator && app.embedRegistry.registerExtension(ext, creator);
      });
    };
  }
}
