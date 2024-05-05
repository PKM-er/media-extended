import { normalizePath, Notice, TFolder } from "obsidian";
import type MxPlugin from "@/mx-main";

export async function getSaveFolder(
  folderPath: string | undefined,
  { plugin, sourcePath }: { plugin: MxPlugin; sourcePath: string },
): Promise<TFolder> {
  const { fileManager, vault } = plugin.app;
  if (!folderPath) {
    const random = `${Date.now()}.${Math.random().toString(36).substring(2)}`;
    folderPath = normalizePath(
      (
        await fileManager.getAvailablePathForAttachment(random, sourcePath)
      ).replace(random, ""),
    );
  }
  const folder = vault.getAbstractFileByPath(folderPath);
  if (folder instanceof TFolder) {
    return folder;
  }
  if (folder === null) {
    return await vault.createFolder(folderPath).catch((e) => {
      new Notice(
        `Failed to create folder ${folderPath}: ${
          e instanceof Error ? e.message : e
        }`,
      );
      throw e;
    });
  }
  new Notice(`Folder path occupied, check your preferences: ${folder.path}`);
  throw new Error(`Folder occupied: ${folder.path}`);
}
