import path from "@/lib/path";
import { getFsPromise } from "@/lib/require";
import type { FileInfo } from "./file-info";
import { toFileInfo } from "./file-info";

/**
 * @param exclude names of files under the directory to exclude
 */
export async function* iterSiblings(
  dirPath: string,
  exclude: string[] = [],
): AsyncGenerator<FileInfo> {
  const fs = getFsPromise();
  if (!fs) return;
  const excludeSet = new Set(exclude);
  const dir = await fs.opendir(dirPath, { encoding: "utf-8" });
  for await (const f of dir) {
    if (!(f.isFile() || f.isSymbolicLink()) || excludeSet.has(f.name)) continue;
    yield toFileInfo(path.join(dirPath, f.name), path.sep);
  }
}
