import { TFolder, TFile } from "obsidian";

export function* iterateFiles(folder: TFolder): IterableIterator<TFile> {
  for (const child of folder.children) {
    if (child instanceof TFolder) {
      yield* iterateFiles(child);
    } else if (child instanceof TFile) {
      yield child;
    }
  }
}
